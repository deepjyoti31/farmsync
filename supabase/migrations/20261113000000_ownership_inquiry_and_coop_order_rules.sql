-- Part 10: Workspace ownership, marketplace answers and co-op order deadlines
--
-- 1. A team admin could set organizations.owner_id to themselves (the update
--    policy had no WITH CHECK, so the new row only had to pass the same test
--    as the old one) and then, as "owner", delete the whole team. is_personal
--    could be flipped the same way. Neither is something the app ever changes.
-- 2. A buyer could mark their own marketplace inquiry "accepted", and either
--    side could move an inquiry to another listing or rewrite the other side's
--    words. Only the seller answers an inquiry; only the buyer edits it.
-- 3. Members could commit to, change or withdraw from a bulk order after its
--    deadline, and could mark their own commitment "paid". Owners and admins
--    could not update commitments at all, so nobody could record a payment.
--
-- Changes from the service role (auth.uid() is NULL) are not restricted.
-- Idempotent: safe to re-run.

-- -----------------------------------------------------------------------------
-- 1. Organizations: owner and kind are fixed once created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_organization_owner()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NOT NULL
       AND (NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.is_personal IS DISTINCT FROM OLD.is_personal) THEN
        RAISE EXCEPTION 'The owner of a workspace, and whether it is personal, cannot be changed'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_organization_owner ON public.organizations;
CREATE TRIGGER protect_organization_owner
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.protect_organization_owner();

-- -----------------------------------------------------------------------------
-- 2. Marketplace inquiries: the seller answers, the buyer edits
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_marketplace_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_seller UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.listing_id IS DISTINCT FROM OLD.listing_id OR NEW.buyer_id IS DISTINCT FROM OLD.buyer_id THEN
        RAISE EXCEPTION 'An inquiry cannot be moved to another listing or buyer'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    SELECT seller_id INTO v_seller FROM public.marketplace_listings WHERE id = OLD.listing_id;

    IF NEW.status IS DISTINCT FROM OLD.status AND auth.uid() IS DISTINCT FROM v_seller THEN
        RAISE EXCEPTION 'Only the seller can accept or decline an inquiry'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF (NEW.message IS DISTINCT FROM OLD.message OR NEW.offer_price IS DISTINCT FROM OLD.offer_price)
       AND (auth.uid() IS DISTINCT FROM OLD.buyer_id OR OLD.status <> 'pending') THEN
        RAISE EXCEPTION 'Only the buyer can change an inquiry, and only before it is answered'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_marketplace_inquiry ON public.marketplace_inquiries;
CREATE TRIGGER protect_marketplace_inquiry
    BEFORE UPDATE ON public.marketplace_inquiries
    FOR EACH ROW EXECUTE FUNCTION public.protect_marketplace_inquiry();

-- -----------------------------------------------------------------------------
-- 3. Co-op bulk orders: commitments close at the deadline
-- -----------------------------------------------------------------------------
-- Whether members can still commit to, change or withdraw from an order.
CREATE OR REPLACE FUNCTION public.bulk_order_accepts_commitments(p_bulk_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.bulk_orders b
        WHERE b.id = p_bulk_order_id
          AND b.status = 'open'
          AND b.deadline > now()
          AND public.is_org_member(b.organization_id)
    );
$$;
REVOKE ALL ON FUNCTION public.bulk_order_accepts_commitments(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_order_accepts_commitments(UUID) TO authenticated;

DROP POLICY IF EXISTS "Members commit to orders" ON public.member_orders;
CREATE POLICY "Members commit to orders" ON public.member_orders FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND status = 'committed'
        AND public.bulk_order_accepts_commitments(bulk_order_id)
    );

DROP POLICY IF EXISTS "Members update own orders" ON public.member_orders;
CREATE POLICY "Members update own orders" ON public.member_orders FOR UPDATE
    USING (user_id = auth.uid() AND public.bulk_order_accepts_commitments(bulk_order_id))
    WITH CHECK (
        user_id = auth.uid()
        -- Payment is recorded by the co-op, not by the member.
        AND status = 'committed'
        AND public.bulk_order_accepts_commitments(bulk_order_id)
    );

DROP POLICY IF EXISTS "Members withdraw own orders" ON public.member_orders;
CREATE POLICY "Members withdraw own orders" ON public.member_orders FOR DELETE
    USING (user_id = auth.uid() AND public.bulk_order_accepts_commitments(bulk_order_id));

DROP POLICY IF EXISTS "Admins update member orders" ON public.member_orders;
CREATE POLICY "Admins update member orders" ON public.member_orders FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND public.is_org_member(b.organization_id, ARRAY['owner', 'admin'])))
    WITH CHECK (EXISTS (SELECT 1 FROM public.bulk_orders b WHERE b.id = bulk_order_id AND public.is_org_member(b.organization_id, ARRAY['owner', 'admin'])));
