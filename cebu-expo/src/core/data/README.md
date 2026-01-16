# Data Layer

Once the contents of this folder change, update this document.

## Architecture
WatermelonDB-based data layer mirroring iOS Core Data schema. Provides models, database configuration, and repositories for reactive data access with soft delete support.

## File Registry

| Name | Status/Importance | Core Function |
|------|------------------|---------------|
| models/ | Critical | WatermelonDB model classes with schema definitions |
| database/ | Critical | Database initialization and configuration |
| repositories/ | Critical | Data access layer with CRUD operations and observables |
| README.md | Documentation | This manifest file |
