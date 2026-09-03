# Product Context

## Why This Project Exists
Farming operations heavily depend on weather conditions and precise crop growth stages. Traditional static calendars fail when unexpected rain, heavy wind, or sudden temperature drops make pesticide spraying or soil fertilization ineffective or hazardous.

This application bridges verified crop knowledge (templates from Payload CMS) with real-time micro-location weather data (Open-Meteo) to provide an adaptive field task list that adjusts automatically, while maintaining synchronized records across web management consoles and mobile field interfaces.

## Problems Solved
- **Wasted Agrochemicals & Cost**: Prevents spraying pesticides right before heavy rain, saving chemicals, labor costs, and reducing environmental runoff.
- **Forgotten Agricultural Operations**: Provides clear timeline stages for critical fertilization, irrigation, and harvesting windows.
- **Double Entry & Out-of-Sync Records**: Any planting or field created in the web portal or mobile simulator is instantly reflected in both interfaces via unified event-driven synchronization (`eh_fields_sync` & localStorage persistence).
- **Field Confusion**: Visualizes parcel coordinates and polygons on map views with click-to-focus navigation directly from task and field lists.

## User Experience Goals
- **Field-Friendly UI**: High-contrast, clean layout readable under direct sunlight with prominent status pills and touch-friendly controls.
- **Clean State & User-Driven Data**: No synthetic mock tasks or artificial logs—farmers start with a clean slate and build their true field operations.
- **Automated Weather Shield**: Automatic task rescheduling with clear explanations (e.g., "Shifted due to predicted 12mm rain").
- **Instant Reactive Feedback**: Immediate visual confirmation and dialog alerts when planting records or tasks are created or updated.
- **Offline & Low-Bandwidth Reliability**: Local data persistence so farmers can view tasks and parcel info even without cellular connectivity.

