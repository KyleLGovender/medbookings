# Tailwind CSS 3.4.1 Documentation

## Overview

Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs directly in your markup. Instead of writing custom CSS, you compose styles using pre-built classes.

## Core Concepts

### Utility-First Approach

```html
<!-- Traditional CSS approach -->
<div class="card">
  <h2 class="card-title">Welcome</h2>
  <p class="card-description">This is a card component.</p>
</div>

<!-- Tailwind utility-first approach -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-gray-900">Welcome</h2>
  <p class="text-gray-600 mt-2">This is a card component.</p>
</div>
```

### Advantages for MedBookings

- **Faster Development**: No time spent naming classes or switching between files
- **Safer Changes**: Utilities only affect the element they're applied to
- **Better Maintainability**: Styles live alongside markup
- **Consistent Design System**: Built-in design tokens ensure consistency

## Configuration

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Custom colors for MedBookings
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        appointment: {
          pending: '#fbbf24',
          confirmed: '#10b981',
          cancelled: '#ef4444',
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### CSS Variables Setup

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    
    /* Medical-specific variables */
    --medical-primary: 199 89% 48%;
    --appointment-confirmed: 142 76% 36%;
    --appointment-pending: 45 93% 47%;
    --appointment-cancelled: 0 84% 60%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
  }
}
```

## Responsive Design

### Breakpoints

```typescript
// Mobile-first breakpoints
const breakpoints = {
  sm: '640px',   // @media (min-width: 640px)
  md: '768px',   // @media (min-width: 768px)
  lg: '1024px',  // @media (min-width: 1024px)
  xl: '1280px',  // @media (min-width: 1280px)
  '2xl': '1536px', // @media (min-width: 1536px)
}
```

### Responsive Usage

```jsx
// Medical dashboard responsive layout
function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: stack vertically, Desktop: side-by-side */}
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 bg-white shadow-sm">
          <nav className="p-4 space-y-2">
            <a className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
              Dashboard
            </a>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Grid: 1 column on mobile, 3 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold">Appointments Today</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
```

## Common Utility Classes

### Layout & Spacing

```jsx
// Flexbox utilities
<div className="flex items-center justify-between p-4">
  <h1 className="text-xl font-bold">Patient List</h1>
  <button className="bg-blue-500 text-white px-4 py-2 rounded">
    Add Patient
  </button>
</div>

// Grid utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {patients.map(patient => (
    <div key={patient.id} className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold">{patient.name}</h3>
      <p className="text-gray-600">{patient.email}</p>
    </div>
  ))}
</div>

// Spacing utilities
<div className="space-y-4"> {/* Vertical spacing between children */}
  <div className="mb-4 p-6 mx-auto max-w-md"> {/* Margin and padding */}
    Content
  </div>
</div>
```

### Typography

```jsx
// Text sizing and styling
<div className="space-y-4">
  <h1 className="text-4xl font-bold text-gray-900">MedBookings</h1>
  <h2 className="text-2xl font-semibold text-gray-800">Patient Dashboard</h2>
  <p className="text-base text-gray-600 leading-relaxed">
    Welcome to your medical appointment management system.
  </p>
  <small className="text-sm text-gray-500">Last updated: 2 hours ago</small>
</div>

// Text alignment and decoration
<div className="text-center">
  <p className="underline decoration-blue-500 decoration-2">
    Important Notice
  </p>
</div>
```

### Colors & Backgrounds

```jsx
// Medical appointment status colors
function AppointmentCard({ appointment }) {
  const statusColors = {
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status]}`}>
          {appointment.status}
        </span>
      </div>
      <p className="text-gray-600 text-sm">{appointment.time}</p>
    </div>
  )
}
```

## State Variants & Interactions

### Hover & Focus States

```jsx
// Interactive button with all states
<button className="
  bg-blue-500 hover:bg-blue-600 active:bg-blue-700
  text-white font-medium py-2 px-4 rounded-md
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">
  Book Appointment
</button>

// Card with hover effects
<div className="
  bg-white rounded-lg shadow-sm border
  hover:shadow-md hover:border-blue-200
  transition-all duration-200 cursor-pointer
  transform hover:-translate-y-1
">
  <div className="p-6">
    <h3 className="font-semibold text-gray-900">Dr. Sarah Johnson</h3>
    <p className="text-gray-600">Cardiologist</p>
  </div>
</div>
```

### Dark Mode

```jsx
// Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <h1 className="text-xl font-bold">Dashboard</h1>
  <p className="text-gray-600 dark:text-gray-300">
    Welcome to your medical dashboard
  </p>
  <button className="
    bg-blue-500 dark:bg-blue-600 
    hover:bg-blue-600 dark:hover:bg-blue-700
    text-white px-4 py-2 rounded
  ">
    Primary Action
  </button>
</div>
```

## Component Patterns for MedBookings

### Form Components

```jsx
// Medical form with Tailwind styling
function PatientForm() {
  return (
    <form className="space-y-6 max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          className="
            w-full px-3 py-2 border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder-gray-400
          "
          placeholder="Enter patient name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical History
        </label>
        <textarea
          rows="4"
          className="
            w-full px-3 py-2 border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder-gray-400 resize-none
          "
          placeholder="Enter medical history"
        />
      </div>
      
      <button
        type="submit"
        className="
          w-full bg-blue-600 hover:bg-blue-700 
          text-white font-medium py-2 px-4 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200
        "
      >
        Save Patient
      </button>
    </form>
  )
}
```

### Dashboard Cards

```jsx
// Medical dashboard statistics cards
function StatsCards() {
  const stats = [
    { label: 'Total Patients', value: '1,249', change: '+12%', trend: 'up' },
    { label: 'Appointments Today', value: '23', change: '+3%', trend: 'up' },
    { label: 'Cancelled Today', value: '2', change: '-50%', trend: 'down' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.label}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Custom CSS Layers

### Component Layer

```css
/* globals.css */
@layer components {
  /* Medical card component */
  .medical-card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }
  
  .medical-card:hover {
    @apply shadow-md border-blue-200 transform -translate-y-0.5;
  }
  
  /* Status badges */
  .status-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .status-badge-confirmed {
    @apply bg-green-100 text-green-800;
  }
  
  .status-badge-pending {
    @apply bg-yellow-100 text-yellow-800;
  }
  
  .status-badge-cancelled {
    @apply bg-red-100 text-red-800;
  }
  
  /* Form inputs */
  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
           placeholder-gray-400;
  }
  
  /* Primary button */
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           transition-colors duration-200;
  }
}
```

## Performance Optimization

### Purging Unused CSS

Tailwind automatically removes unused classes in production:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // ... other config
}
```

### JIT (Just-In-Time) Compilation

Tailwind 3.x uses JIT by default, generating styles on-demand for better performance and smaller CSS files.

## Best Practices for MedBookings

1. **Use Design Tokens**: Define custom colors and spacing in your config
2. **Component Classes**: Use `@layer components` for frequently used patterns
3. **Responsive First**: Design mobile-first, then add desktop styles
4. **Consistent Spacing**: Use consistent spacing scale (4, 8, 16, 24px, etc.)
5. **Semantic Color Names**: Use meaningful color names like `medical-primary` instead of generic blue
6. **Dark Mode Ready**: Plan for dark mode from the start

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com)
- [Tailwind Play (Online Playground)](https://play.tailwindcss.com)
- [Headless UI Components](https://headlessui.com)

Version: 3.4.1