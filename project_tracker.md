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

### 3. Crop Management
- **Crop Planning**: Plan and track crops with planting dates, expected harvest dates
- **Crop Status Tracking**: Monitor crop status (planned, planted, growing, harvested, failed)
- **Crop Activities**: Record activities related to crops (planting, fertilizing, harvesting)

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
3. **crops**: Crop information
4. **field_crops**: Junction table linking fields and crops with planting details
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

# Enhancement Plan

## 1. Advanced Analytics and Insights

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
