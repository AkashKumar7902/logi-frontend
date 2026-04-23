## Logi Frontend

### Local Run
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Environment Variables
Create `.env` (or inject via hosting platform):
- `VITE_API_BASE_URL=http://localhost:8080`
- `VITE_WS_BASE_URL=ws://localhost:8080`
- `VITE_MAPBOX_ACCESS_TOKEN=<mapbox-public-token>`

Legacy `REACT_APP_*` variables are still supported during the migration window.
