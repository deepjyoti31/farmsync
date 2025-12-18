# FarmSync Project Tracker

## Project Overview

FarmSync is a comprehensive farm management application designed to streamline operations on modern farms. It provides tools for managing various aspects of farming with a user-friendly interface and data-driven insights.

## Current Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: React Query for server state
- **Routing**: React Router

### Backend
- **Database & Authentication**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Functions**: Supabase Edge Functions

### APIs & Integrations
- **Mapping**: Mapbox GL JS for maps, @mapbox/mapbox-gl-draw for boundary drawing
- **Weather**: WeatherAPI.com for weather data
- **Geospatial**: @mapbox/geojson-area for area calculations

## Current Features

### 1. Farm Management
- **Farm Registration**: Users can add farms with detailed information including name, location (village, district, state)
- **Farm Boundaries**: Interactive map interface using Mapbox where users can draw farm boundaries
- **Area Calculation**: Automatic calculation of farm area based on drawn boundaries
- **Farm Details**: Display of farm information including area, GPS coordinates, and boundaries on a map
- **Farm Listing**: View, edit, and delete farms from a central dashboard

### 2. Field Management
- **Field Registration**: Add fields within farms with details like area, soil type, and soil pH
- **Field-Crop Association**: Associate crops with specific fields
- **Parent Farm Display**: Fields display their parent farm name for better context
- **Field Cards**: Redesigned field cards with improved layout and information display
- **Quick Field Creation**: Add fields directly from the Farms page or farm details dialog
- **Farm Context Preservation**: When adding fields, the parent farm is pre-selected
- **Field Grouping**: Fields are grouped by farm in selection dropdowns

### 3. Crop Management
- **Crop Planning**: Plan and track crops with planting dates, expected harvest dates
- **Crop Status Tracking**: Monitor crop status (planned, planted, growing, harvested, failed)
- **Crop Activities**: Record activities related to crops (planting, fertilizing, harvesting)
- **Crop Categorization**: Organize crops by type (vegetables, fruits, cereals, flowers)
- **Automatic Harvest Date**: Calculate expected harvest dates based on planting date and crop growing duration
- **Crop Details View**: View comprehensive information about each crop
- **Status Updates**: Update crop status as it progresses through growth stages

### 4. Livestock Management
- **Livestock Registration**: Add livestock with details like type, breed, gender, and status
- **Livestock Types**: Predefined livestock types with categories
- **Livestock Tracking**: Monitor livestock status (active, sold, deceased)
- **Acquisition Details**: Record birth/acquisition dates and costs

### 5. Weather Integration
- **Current Weather**: Display current weather conditions for farm locations
- **Weather Forecasts**: Show upcoming weather forecasts
- **Weather Data Storage**: Store historical weather data for farms

### 6. Mapping Features
- **Interactive Maps**: Mapbox integration for visualizing farm boundaries
- **Boundary Drawing**: Tools for drawing and editing farm boundaries
- **Geolocation**: Support for finding user's current location
- **Area Calculation**: Automatic calculation of area from drawn boundaries

### 7. Community & Forums
- **Discussion Categories**: Organized forum categories
- **Posts & Comments**: User-generated content with comments
- **Post Likes**: Social engagement through likes

### 8. Financial Management
- **Financial Transactions**: Record and track farm-related financial transactions
- **Acquisition Costs**: Track costs associated with livestock and equipment

### 9. Authentication & User Management
- **User Registration & Login**: Secure authentication through Supabase
- **User Profiles**: User information and preferences
- **Row-Level Security**: Data access control based on user ownership

### 10. Additional Features
- **Dashboard**: Overview of farm operations, weather, and tasks
- **Notifications**: System for alerts and notifications
- **Tasks**: Task management with due dates and priorities
- **Reports**: Data analysis and reporting
- **Market Data**: Commodity price information
- **Inventory Management**: Track farm inventory
- **Equipment Management**: Manage farm equipment

## Database Schema

The application uses a PostgreSQL database through Supabase with the following main tables:

1. **farms**: Stores farm information including boundaries as GeoJSON
2. **fields**: Field information linked to farms
3. **crops**: Crop information including crop type (vegetables, fruits, cereals, flowers) and growing duration
4. **field_crops**: Junction table linking fields and crops with planting details, expected harvest dates, and status
5. **livestock**: Livestock information
6. **livestock_types**: Types of livestock
7. **crop_activities**: Activities performed on crops
8. **weather_data**: Weather information for farms
9. **financial_transactions**: Financial records
10. **equipment**: Farm equipment
11. **inventory**: Inventory items
12. **forums**, **forum_posts**, **post_comments**, **post_likes**: Community features

## User Interface

The application features a modern, responsive UI with:
- Main layout with sidebar navigation and top bar
- Dashboard with quick access to important information
- Dedicated pages for each major feature (Farms, Fields, Crops, Livestock, etc.)
- Interactive forms for data entry
- Data tables for information display
- Cards and widgets for summarized information
- Toast notifications for user feedback

## Key Implementation Details

1. **Farm Boundaries**: Uses Mapbox GL and MapboxDraw to allow users to draw polygons representing farm boundaries. The boundaries are stored as GeoJSON in the database.

2. **Area Calculation**: Automatically calculates area from GeoJSON polygons using the @mapbox/geojson-area library, with support for different units (acres, hectares, square meters).

3. **Weather Integration**: Fetches weather data from WeatherAPI.com through Supabase Edge Functions, displaying current conditions and forecasts.

4. **Authentication Flow**: Complete authentication system with sign-up, sign-in, and profile management.

5. **Data Management**: Uses React Query for efficient data fetching, caching, and state management.

## Design Decisions

1. **When adding a farm**: Users should mark the farm boundaries before the farm is added to the database. The area is automatically calculated from the marked boundaries rather than manually entered.

2. **Farm details display**: In the farm details dialog, the map is displayed on the right side and farm information with icons on the left side for better design.

3. **Mapping technology**: Mapbox is used for mapping functionality instead of other mapping libraries.

4. **Review section**: When adding a farm, the area, longitude, and latitude are displayed in the review section, calculated from the marked farm boundaries on the map.

5. **UI organization**: When adding a farm, users see the details and map in one section rather than separate tabs.

6. **Field card design**: Field cards display the parent farm name instead of "No location specified" for better context. Cards use a compact layout with appropriate icons and well-positioned action buttons.

7. **Crop categorization**: When adding a crop, users first select a category (vegetables, fruits, cereals, flowers) and then choose from a filtered list of crops within that category.

8. **Field selection by farm**: When selecting a field for a crop, fields are grouped by their parent farm for better organization and context.

9. **Automatic harvest date calculation**: Based on the selected crop and planting date, the system automatically calculates the expected harvest date while keeping it editable for user adjustments.

10. **Field creation accessibility**: Add Field buttons are placed in multiple strategic locations (Farms page, farm details dialog) to reduce navigation steps.

11. **Authentication notifications**: Authentication success messages are only shown for explicit user actions (login, logout) and not for automatic session refreshes or browser minimization.

## Recent Fixes and Improvements

### 1. Dialog Component Structure
- **Issue**: In the Fields page, the "Add New Field" dialog was appearing nested inside another dialog-like container, creating a poor user experience.
- **Solution**:
  - Restructured the AddFieldForm component to remove dialog-like styling (rounded corners, shadows)
  - Created a wrapper component (FieldsListWithDialog) to manage dialog state and rendering
  - Simplified the Fields page structure to avoid unnecessary nesting
  - Ensured consistent dialog implementation across the application
- **Benefits**:
  - Consistent user experience across all dialogs in the application
  - Cleaner component hierarchy with better separation of concerns
  - Improved maintainability with a standardized approach to dialog implementation

### 2. Field Card Redesign
- **Issue**: Field cards had a large icon taking up space, showed redundant information, and had overlapping edit/delete buttons.
- **Solution**:
  - Redesigned field cards with a more compact and informative layout
  - Replaced the large icon with a smaller, more appropriate icon (LandPlot)
  - Added edit functionality directly in the card header
  - Improved the positioning of action buttons to prevent overlap
  - Removed redundant information (soil type was shown twice)
  - Created a dedicated EditFieldForm component for editing fields
  - Added parent farm name display in field cards for better context
- **Benefits**:
  - More efficient use of space in the field cards
  - Clearer information hierarchy with better visual organization
  - Improved user experience with properly positioned action buttons
  - Better context with parent farm name displayed prominently

### 3. Enhanced Crop Management
- **Issue**: The crop management system lacked categorization, field grouping by farm, and automatic harvest date calculation.
- **Solution**:
  - Added crop type categorization (vegetables, fruits, cereals, flowers)
  - Implemented filtering of crops based on selected category
  - Added a crop_type column to the database
  - Grouped fields by farm in the field selection dropdown
  - Added automatic calculation of expected harvest date based on planting date and crop growing duration
  - Made the harvest date editable for user adjustments
- **Benefits**:
  - Easier crop selection through logical categorization
  - Better organization of fields by showing which farm they belong to
  - Time-saving through automatic harvest date calculation
  - Improved user experience with a more logical form flow

### 4. Crop Details and Status Management
- **Issue**: After adding a crop, there was no way to view details, update status, or delete it.
- **Solution**:
  - Created a CropDetailsDialog component to display comprehensive crop information
  - Implemented an UpdateCropStatusForm component for status changes
  - Added View, Edit, and Delete buttons to the crop listing
  - Made the View button open the details dialog
  - Made the Edit button open the same dialog focused on status update
  - Enhanced the Delete functionality with proper confirmation
- **Benefits**:
  - Complete crop lifecycle management
  - Easy status updates as crops progress through growth stages
  - Better data organization with detailed view of crop information
  - Improved user control over crop data

### 5. Fields Page Loading and Authentication Improvements
- **Issue**: The Fields page sometimes failed to load fields properly, and authentication toasts appeared on browser minimize/refresh.
- **Solution**:
  - Added better error handling and retry logic to the fields query
  - Improved farm selection logic to ensure a farm is always selected when available
  - Added force refetch when the component mounts
  - Added an isInitialAuthCheck flag to track when the app is first loading
  - Removed automatic toast messages from auth state changes
  - Only show toast messages for explicit user actions
- **Benefits**:
  - More reliable data loading with proper error handling
  - Smoother user experience with fewer unnecessary notifications
  - Proper UI updates when data changes
  - Less intrusive authentication process

### 6. Field Management Accessibility
- **Issue**: Adding fields required navigating to the Fields page, creating extra steps for users.
- **Solution**:
  - Added "Add Field" buttons in multiple locations:
    - Next to "View Details" on the Farms page
    - In the fields tab of the farm details dialog
  - Ensured the farm is pre-selected when adding a field from these locations
  - Added proper query invalidation to refresh field lists after adding
- **Benefits**:
  - Reduced number of steps needed to add a field
  - More intuitive workflow for farm and field management
  - Consistent user experience across different entry points
  - Improved data consistency with proper refreshing

### 7. Mobile Optimization (PWA)
- **Issue**: Application was not optimized for mobile devices and required internet connection.
- **Solution**:
  - Implemented Progressive Web App (PWA) capabilities with manifest and service workers
  - Added "Add to Home Screen" support
  - Created a responsive mobile navigation with hamburger menu (Sheet component)
  - Unified header structure for both mobile and desktop
  - Implemented offline read-only access using `PersistQueryClientProvider` and local storage
- **Benefits**:
  - Native app-like experience on mobile devices
  - Access to farm data even without internet connection (offline mode)
  - Better usability on small screens with dedicated mobile navigation
  - Improved performance through caching

### 8. Smart Farming (IoT)
- **Issue**: No integration with physical farm hardware or sensors.
- **Solution**:
  - Implemented hardware-agnostic IoT architecture using Supabase Edge Functions
  - Created `devices` and `telemetry` tables to store hardware registry and streaming data
  - Built `ingest-telemetry` API endpoint that accepts JSON from any device type
  - Added new "IoT & Sensors" dashboard page for device management and real-time visualization
  - Supported diverse sensor types: Weather, Soil, Irrigation, Livestock, Drones, Camera, Storage
- **Benefits**:
  - Real-time monitoring of farm conditions
  - Compatibility with any hardware vendor (DIY or Commercial)
  - Centralized dashboard for all farm assets
  - Foundation for future automated alerts and AI analysis

### 9. Advanced Analytics
- **Issue**: Lack of deep insights into financial health and crop yield performance.
- **Solution**:
  - Implemented `harvests` table to track actual crop yield efficiency
  - Created a dedicated **Analytics Dashboard** (`/dashboard/analytics`)
  - Added "Financial Health" view with Profit/Loss, Revenue vs Expense charts, and category breakdown
  - Added "Yield Analysis" view to benchmark crop performance per hectare
- **Benefits**:
  - Data-driven decision making for crop planning
  - Clear visibility into farm profitability and major cost centers
  - Ability to compare planned vs actual production

### 10. Sustainability & Compliance
- **Issue**: No standardized way to track chemical inputs and water usage for certification.
- **Solution**:
  - Implemented `sustainability_logs` table for detailed input tracking (fertilizers, pesticides)
  - Created `water_usage` table for irrigation monitoring
  - Added dedicated **Sustainability Dashboard** (`/dashboard/sustainability`)
  - Built "Compliance Reports" view to generate audit-ready logs for Organic/GlobalG.A.P certification
- **Benefits**:
  - Simplified certification audits
  - Responsible resource management
  - Complete digital trail of all farm inputs

### 11. Internationalization (i18n) Foundation
- **Issue**: Application was English-only and lacked support for Right-to-Left (RTL) languages or regional formatting.
- **Solution**:
  - Implemented `i18next` architecture with `I18nProvider` for seamless translation loading
  - Created initial translation files (`en/translation.json`)
  - Added `useDirection` hook to automatically set `dir="rtl"` based on language
  - Refactored core UI components (`Sidebar`, `StatsCard`, `Table`, `Toast`) to use logical properties (`ms-`, `me-`, `text-start`) instead of physical ones (`ml-`, `mr-`, `text-left`)
- **Benefits**:
  - Ready for multi-language support (including Arabic/Hebrew)
  - Scalable formatting for dates and numbers
  - Foundation for global accessibility features

### [x] Multi-User & Role-Based Access Control (RBAC)
- [x] Database Schema (Organizations, Members, Invites)
- [x] RLS Policies for secure access
- [x] UI for Organization Management (Create, Invite, Switch)
- [x] Role definitions (Owner, Admin, Editor, Viewer)
- **Benefits**:
  - Secure team collaboration
  - Granular access control
  - Scalable for large farming operations

# Enhancement Plan

## 1. Future Enhancements

### Crop Performance Analytics
- **Yield Prediction**: Implement machine learning models to predict crop yields based on historical data, weather patterns, and soil conditions
- **Crop Comparison**: Allow farmers to compare performance of different crops across seasons and fields
- **Optimal Planting Recommendations**: Suggest optimal planting times based on historical weather data and crop requirements

### Financial Analytics
- **Profitability Analysis**: Track profitability by crop, field, and season
- **Cost Tracking**: Enhanced expense tracking categorized by type (seeds, fertilizer, labor, equipment)
- **ROI Calculator**: Calculate return on investment for different farming activities
- **Budget Planning**: Create seasonal and annual budgets with variance analysis

### Resource Optimization
- **Water Usage Tracking**: Monitor water consumption and suggest irrigation optimization
- **Fertilizer Efficiency**: Track fertilizer application and effectiveness
- **Labor Allocation**: Analyze labor hours by task and optimize workforce allocation

## 2. Mobile Optimization and Offline Capabilities

### Progressive Web App (PWA)
- **Offline Mode**: Enable core functionality without internet connection
- **Data Synchronization**: Sync data when connection is restored
- **Push Notifications**: Send critical alerts even when app isn't open

### Mobile-Specific Features
- **GPS Field Mapping**: Walk the perimeter of fields with mobile device to map boundaries
- **Photo Documentation**: Take and categorize photos of crops, equipment issues, or pests
- **Voice Notes**: Record voice notes for quick documentation in the field
- **QR Code Integration**: Scan QR codes on equipment or livestock tags for quick access to records

## 3. IoT and Sensor Integration

### Sensor Data Collection
- **Weather Station Integration**: Connect to on-farm weather stations for hyperlocal data
- **Soil Moisture Sensors**: Monitor soil moisture levels in different fields
- **Equipment Sensors**: Track equipment usage, maintenance needs, and fuel consumption

### Automated Alerts
- **Threshold Alerts**: Set up alerts for when sensor readings exceed defined thresholds
- **Predictive Maintenance**: Alert when equipment is due for maintenance based on usage patterns
- **Frost/Heat Warnings**: Send critical weather alerts based on local conditions

## 4. Enhanced Crop Management

### Pest and Disease Management
- **Identification Tool**: AI-powered identification of common pests and diseases from photos
- **Treatment Tracking**: Record treatments applied and their effectiveness
- **Risk Forecasting**: Predict pest and disease risks based on weather conditions

### Crop Rotation Planning
- **Rotation Recommendations**: Suggest optimal crop rotations based on soil health and previous crops
- **Visual Planner**: Interactive visual tool for planning crop rotations across multiple seasons
- **Companion Planting**: Suggestions for companion plants to improve yields and reduce pests

### Precision Agriculture
- **Field Zoning**: Divide fields into management zones based on soil properties and yield data
- **Variable Rate Application**: Plan variable rate application of inputs based on field zones
- **Yield Mapping**: Visualize yield variations across fields to identify problem areas

## 5. Advanced Livestock Management

### Health Monitoring
- **Health Records**: Detailed health records including vaccinations, treatments, and check-ups
- **Growth Tracking**: Monitor weight gain and development against benchmarks
- **Breeding Management**: Track breeding cycles, pregnancy, and offspring

### Feed Management
- **Feed Inventory**: Track feed inventory and consumption
- **Nutrition Planning**: Plan balanced nutrition based on livestock type and life stage
- **Cost Analysis**: Analyze feed costs and efficiency

### Livestock Genealogy
- **Family Trees**: Track lineage and breeding history
- **Genetic Traits**: Record and analyze genetic traits and performance

## 6. Supply Chain and Market Integration

### Market Intelligence
- **Price Tracking**: Real-time and historical price data for crops and livestock
- **Market Trends**: Analysis of market trends and forecasts
- **Optimal Selling Time**: Recommendations for when to sell based on historical price patterns

### Supply Chain Management
- **Buyer Connections**: Directory of potential buyers with contact information
- **Contract Management**: Track and manage sales contracts
- **Logistics Planning**: Plan transportation and delivery of products

### Certification and Compliance
- **Organic Certification**: Track compliance with organic certification requirements
- **Food Safety Records**: Maintain records required for food safety compliance
- **Sustainability Metrics**: Track and report on sustainability metrics

## 7. Enhanced Weather and Climate Features

### Climate Resilience Planning
- **Long-term Climate Analysis**: Analyze changing climate patterns in the farm's region
- **Adaptation Strategies**: Suggest adaptation strategies based on climate projections
- **Risk Assessment**: Identify climate-related risks specific to the farm's location and crops

### Advanced Weather Integration
- **Microclimate Monitoring**: Track and analyze microclimates within the farm
- **Weather-Based Scheduling**: Automatically adjust task schedules based on weather forecasts
- **Historical Weather Analysis**: Compare current conditions to historical patterns

## 8. Community and Knowledge Sharing

### Enhanced Forum Features
- **Expert Q&A**: Dedicated sections for expert advice
- **Regional Groups**: Location-based groups for sharing local knowledge
- **Resource Library**: Searchable library of farming resources and best practices

### Marketplace
- **Equipment Sharing**: Platform for sharing or renting equipment with nearby farmers
- **Seed/Livestock Exchange**: Marketplace for trading seeds, livestock, or other farm products
- **Service Provider Directory**: Directory of local service providers (veterinarians, mechanics, etc.)

### Collaborative Features
- **Shared Calendars**: Coordinate activities with family members or employees
- **Task Assignment**: Assign and track tasks across the farm team
- **Knowledge Base**: Build a farm-specific knowledge base for continuity

## 9. Sustainability and Environmental Impact

### Carbon Footprint Tracking
- **Carbon Calculator**: Calculate the farm's carbon footprint
- **Sequestration Tracking**: Track carbon sequestration activities
- **Emission Reduction Suggestions**: Recommend practices to reduce emissions

### Biodiversity Monitoring
- **Wildlife Tracking**: Record wildlife sightings and habitat areas
- **Beneficial Insect Monitoring**: Track populations of pollinators and beneficial insects
- **Habitat Planning**: Plan and track habitat creation or restoration projects

### Water Management
- **Water Quality Monitoring**: Track water quality parameters
- **Watershed Impact**: Analyze the farm's impact on local watersheds
- **Conservation Planning**: Plan and track water conservation measures

## 10. Augmented Reality and Visual Tools

### AR Field Visualization
- **Crop Growth Visualization**: Use AR to visualize crop growth stages
- **Underground Visualization**: Visualize root systems, irrigation lines, or drainage
- **Equipment Guidance**: AR guidance for equipment operation and maintenance

### Visual Documentation
- **Time-lapse Capabilities**: Create time-lapse documentation of crop growth
- **Drone Integration**: Import and analyze drone imagery
- **3D Farm Modeling**: Create 3D models of the farm for planning and visualization

## 11. Global Accessibility Infrastructure

### Internationalization & Localization
- **Multi-Language Support**: RTL support (Arabic/Hebrew) and scalable translation architecture
- **Unit Conversions**: Native handling of Imperial, Metric, and Traditional units (e.g., Bigha, Feddan)
- **Calendar Systems**: Support for agricultural calendars beyond Gregorian (Hijri, Lunisolar, Ethiopian)
- **Currency Agnosticism**: Multi-currency support for global markets

### Low-Bandwidth Resilience
- **SMS/USSD Interface**: Basic data entry and alerts via SMS for feature phones
- **IVR Services**: Voice-based advisory services for accessibility
- **Data Lite Mode**: Text-only PWA mode for 2G/EDGE networks

## 12. Scalable Farm Models

### Multi-User & RBAC
- **Organization Level**: Support for Cooperatives and Organizations above Farm level
- **Role-Based Access**: Granular roles (Owner, Manager, Agronomist, Worker, Auditor)
- **Audit Trails**: Detailed logs of record changes for certification tracking

### Cooperative Management
- **Aggregated Analytics**: Yield forecasts across member farms
- **Bulk Purchasing**: Management of group buy orders for inputs
- **Traceability Batches**: Aggregation of produce for export lots

## 13. Ecosystem & Value Chain

### Financial Integration
- **Micro-Finance**: Creditworthiness reporting based on yield/input history
- **Insurance Automation**: Weather-index based claim generation
- **Mobile Payments**: Integration with local payment gateways (M-Pesa, UPI, Stripe)

### Regulatory Compliance
- **Dynamic Compliance Engine**: Pluggable rule sets (EU Organic, USDA GAP, India NPOP)
- **Auto-Validation**: Pre-application warnings for banned inputs based on active compliance packs

### Marketplace Connection
- **Virtual Mandi**: Direct connection to buyers and wholesalers
- **Supplier Directory**: Verified local input suppliers directory

## Implementation Roadmap

### Phase 1: Foundation Enhancements (3-6 months)
- Mobile optimization and offline capabilities
- Enhanced crop and livestock management features
- Advanced weather integration
- Basic analytics dashboard

### Phase 2: Advanced Features (6-12 months)
- IoT and sensor integration
- Supply chain and market intelligence
- Enhanced community features
- Sustainability tracking

### Phase 3: Cutting-Edge Capabilities (12-18 months)
- AI-powered predictions and recommendations
- Augmented reality tools
- Advanced analytics and machine learning
- Full supply chain integration

## Technical Considerations

### Architecture Updates
- Implement a more robust offline-first architecture
- Develop a microservices approach for scalability
- Enhance data security for sensitive farm information

### Integration Requirements
- APIs for weather services, market data, and IoT devices
- Mobile-specific optimizations
- Cloud infrastructure for machine learning capabilities

### User Experience Considerations
- Maintain simplicity despite added complexity
- Implement progressive disclosure of advanced features
- Ensure performance on low-bandwidth rural connections
