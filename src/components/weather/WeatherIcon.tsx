import React from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Icon for a weather condition string from the forecast service, coloured by kind. Decorative: pair it with the condition text. */
const WeatherIcon = ({ condition, className }: { condition: string | undefined; className?: string }) => {
  const c = (condition || '').toLowerCase();
  const props = { className: cn('shrink-0', className), 'aria-hidden': true as const };
  if (c.includes('thunder') || c.includes('storm')) return <CloudLightning {...props} className={cn(props.className, 'text-info')} />;
  if (c.includes('snow') || c.includes('sleet')) return <CloudSnow {...props} className={cn(props.className, 'text-info')} />;
  if (c.includes('drizzle')) return <CloudDrizzle {...props} className={cn(props.className, 'text-info')} />;
  if (c.includes('rain') || c.includes('shower')) return <CloudRain {...props} className={cn(props.className, 'text-info')} />;
  if (c.includes('clear') || c.includes('sunny')) return <Sun {...props} className={cn(props.className, 'text-[#B26B00]')} />;
  if (c.includes('partly')) return <CloudSun {...props} className={cn(props.className, 'text-[#B26B00]')} />;
  if (c.includes('cloud') || c.includes('overcast') || c.includes('mist') || c.includes('fog')) return <Cloud {...props} className={cn(props.className, 'text-muted-foreground')} />;
  return <CloudSun {...props} className={cn(props.className, 'text-[#B26B00]')} />;
};

export default WeatherIcon;
