# Book Production Management System (BPMS)

A professional, responsive web application for managing book production workflows with role-based access control.

## Features

### Role-Based Interfaces

1. **Boss Dashboard** (Desktop First)
   - KPI cards for business metrics
   - Factory-wise output visualization
   - Project progress tracking
   - Recent activity overview

2. **Accountant Dashboard** (Laptop First)
   - Data-dense tables with sorting
   - Invoice management
   - Financial summaries
   - Export capabilities

3. **Supervisor Panel** (Mobile First)
   - Ultra-simple interface
   - Large touch targets
   - Minimal navigation
   - Production entry forms

### Responsive Design

- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly controls
- No horizontal scrolling

### Authentication

- Role-based login system
- Secure credential handling
- Session management

## Tech Stack

- **Frontend**: React 18, React Router v6
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd bpms-professional
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

Create a production build:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Reusable components
├── pages/           # Page components
│   ├── boss/        # Boss-specific pages
│   ├── accountant/  # Accountant-specific pages
│   └── supervisor/  # Supervisor-specific pages
├── services/        # API services
├── utils/           # Utility functions
├── hooks/           # Custom hooks
├── contexts/        # React contexts
├── App.jsx          # Main App component
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Demo Credentials

- **Boss**: `boss` / `boss123`
- **Accountant**: `accountant` / `acc123`
- **Supervisor (Mahape)**: `supervisor_mahape` / `sup123`
- **Supervisor (Taloja)**: `supervisor_taloja` / `sup456`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary and confidential.