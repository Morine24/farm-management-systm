# Farm Hierarchical Structure

## Structure Overview
```
Farm
└── Sections
    └── Blocks
        └── Beds
            └── Drip Lines
```

## Data Models

### Section
```json
{
  "farmId": "string",
  "name": "string",
  "area": "number",
  "description": "string",
  "createdAt": "timestamp"
}
```

### Block
```json
{
  "sectionId": "string",
  "name": "string",
  "area": "number",
  "cropType": "string",
  "status": "active|inactive",
  "createdAt": "timestamp"
}
```

### Bed
```json
{
  "blockId": "string",
  "name": "string",
  "length": "number",
  "width": "number",
  "plantCount": "number",
  "status": "active|inactive",
  "createdAt": "timestamp"
}
```

### Drip Line
```json
{
  "bedId": "string",
  "name": "string",
  "length": "number",
  "flowRate": "number",
  "status": "working|damaged|maintenance",
  "lastMaintenance": "timestamp",
  "createdAt": "timestamp"
}
```

## API Endpoints

### Sections
- `GET /api/sections/farm/:farmId` - Get all sections for a farm
- `POST /api/sections` - Create new section
- `PUT /api/sections/:id` - Update section
- `DELETE /api/sections/:id` - Delete section

### Blocks
- `GET /api/blocks/section/:sectionId` - Get all blocks for a section
- `POST /api/blocks` - Create new block
- `PUT /api/blocks/:id` - Update block
- `DELETE /api/blocks/:id` - Delete block

### Beds
- `GET /api/beds/block/:blockId` - Get all beds for a block
- `POST /api/beds` - Create new bed
- `PUT /api/beds/:id` - Update bed
- `DELETE /api/beds/:id` - Delete bed

### Drip Lines
- `GET /api/driplines/bed/:bedId` - Get all drip lines for a bed
- `POST /api/driplines` - Create new drip line
- `PUT /api/driplines/:id` - Update drip line
- `DELETE /api/driplines/:id` - Delete drip line
