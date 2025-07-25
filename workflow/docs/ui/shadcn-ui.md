# shadcn/ui Documentation

## Overview

**shadcn/ui** is a set of beautifully-designed, accessible components and a code distribution platform. **It's not a traditional component library** - instead, it gives you the actual component source code that you can customize and control.

### Key Principles

- **Open Code**: You get the actual component source code for full customization
- **Composition**: Common, composable interface across all components
- **Distribution**: Flat-file schema and CLI for easy component distribution
- **Beautiful Defaults**: Carefully chosen default styles
- **AI-Ready**: Open code structure makes it easy for LLMs to understand and improve

## Installation & Setup

### Next.js Installation (Recommended)

```bash
# Initialize shadcn/ui in your project
pnpm dlx shadcn@latest init

# Add individual components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
```

### Core Dependencies

```bash
pnpm add class-variance-authority clsx tailwind-merge lucide-react tailwindcss-animate
```

### Configuration Files

#### `components.json`
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

#### Utility Function (`lib/utils.ts`)
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Theming System

### CSS Variables Approach

shadcn/ui uses a **background/foreground convention** with CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  /* ... dark mode overrides */
}
```

### Medical Color Extensions for MedBookings

```css
:root {
  /* Medical status colors */
  --medical-success: 142 76% 36%;
  --medical-warning: 45 93% 47%;
  --medical-error: 0 84% 60%;
  --medical-info: 199 89% 48%;
  
  /* Appointment status colors */
  --appointment-confirmed: 142 76% 36%;
  --appointment-pending: 45 93% 47%;
  --appointment-cancelled: 0 84% 60%;
  --appointment-completed: 262 83% 58%;
}
```

## Core Component Examples

### Button Component

```tsx
import { Button } from "@/components/ui/button"

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// Medical booking examples
<Button variant="outline" size="sm">
  <Calendar className="mr-2 h-4 w-4" />
  Schedule Appointment
</Button>

<Button variant="destructive" size="sm">
  <X className="mr-2 h-4 w-4" />
  Cancel Booking
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>

// Polymorphic usage
<Button asChild>
  <Link href="/appointments">View Appointments</Link>
</Button>
```

### Dialog Component

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

// Appointment booking dialog
function BookingDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Book Appointment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Select your preferred date and time for the appointment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="provider">Healthcare Provider</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dr-smith">Dr. Sarah Smith</SelectItem>
                <SelectItem value="dr-jones">Dr. Michael Jones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Appointment Date</Label>
            <DatePicker />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Confirm Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Card Component

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Patient information card
function PatientCard({ patient }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={patient.avatar} />
            <AvatarFallback>{patient.initials}</AvatarFallback>
          </Avatar>
          {patient.name}
        </CardTitle>
        <CardDescription>
          Patient ID: {patient.id} • Age: {patient.age}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Email:</span>
            <span className="text-sm">{patient.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Phone:</span>
            <span className="text-sm">{patient.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Last Visit:</span>
            <span className="text-sm">{patient.lastVisit}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">View Profile</Button>
        <Button size="sm">Schedule Appointment</Button>
      </CardFooter>
    </Card>
  )
}

// Appointment status card
function AppointmentCard({ appointment }) {
  const statusColors = {
    confirmed: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
          <Badge className={statusColors[appointment.status]}>
            {appointment.status}
          </Badge>
        </div>
        <CardDescription>
          {appointment.service} with Dr. {appointment.provider}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {appointment.date}
          <Clock className="h-4 w-4 ml-2" />
          {appointment.time}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Form Components with Medical Validation

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Patient registration schema
const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number"),
  }),
})

function PatientRegistrationForm() {
  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      emergencyContact: {
        name: "",
        phone: "",
      },
    },
  })

  function onSubmit(values: z.infer<typeof patientSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll use this email for appointment confirmations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <DatePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Emergency Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergencyContact.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContact.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 987-6543" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Register Patient
        </Button>
      </form>
    </Form>
  )
}
```

## Medical-Specific Component Patterns

### Status Badge System

```tsx
import { Badge } from "@/components/ui/badge"

// Appointment status badges
function AppointmentStatusBadge({ status }) {
  const variants = {
    confirmed: "bg-green-100 text-green-800 hover:bg-green-200",
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    completed: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  }

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Provider specialization badges
function SpecialtyBadge({ specialty }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {specialty}
    </Badge>
  )
}
```

### Medical Data Tables

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function AppointmentsTable({ appointments }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell className="font-medium">
              {appointment.patientName}
            </TableCell>
            <TableCell>Dr. {appointment.providerName}</TableCell>
            <TableCell>
              {format(appointment.dateTime, "MMM dd, yyyy 'at' h:mm a")}
            </TableCell>
            <TableCell>
              <AppointmentStatusBadge status={appointment.status} />
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## Available Components for MedBookings

### Layout & Navigation
- **Card** - Patient info, appointment cards
- **Separator** - Section dividers
- **Tabs** - Multi-section forms
- **Navigation Menu** - Complex navigation
- **Breadcrumb** - Page hierarchy
- **Sidebar** - Dashboard navigation

### Forms & Inputs
- **Button** - Actions, submissions
- **Input** - Patient data entry
- **Textarea** - Medical notes
- **Select** - Provider selection
- **Checkbox** - Consent forms
- **Radio Group** - Option selection
- **Switch** - Settings toggles
- **Date Picker** - Appointment scheduling

### Overlays & Feedback
- **Dialog** - Booking confirmations
- **Alert Dialog** - Cancellation warnings
- **Sheet** - Mobile-friendly modals
- **Popover** - Additional information
- **Tooltip** - Help text
- **Toast** - Success/error messages
- **Alert** - Important notifications

### Data Display
- **Table** - Appointment lists
- **Badge** - Status indicators
- **Avatar** - Patient/provider images
- **Progress** - Loading states
- **Skeleton** - Loading placeholders
- **Calendar** - Date selection

### Utility Components
- **Command** - Quick actions
- **Combobox** - Searchable selects
- **Data Table** - Advanced tables with sorting
- **Pagination** - Large data sets

## Best Practices for MedBookings

### 1. Consistent Status Colors
```tsx
// Define medical status color system
const statusColors = {
  confirmed: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  emergency: "bg-red-500 text-white border-red-600",
}
```

### 2. Accessible Medical Forms
```tsx
// Always include proper labels and descriptions
<FormItem>
  <FormLabel>Medical History</FormLabel>
  <FormControl>
    <Textarea 
      placeholder="Please describe any relevant medical history..."
      {...field} 
    />
  </FormControl>
  <FormDescription>
    This information helps providers give you better care.
  </FormDescription>
  <FormMessage />
</FormItem>
```

### 3. Mobile-First Medical UI
```tsx
// Use responsive classes for medical dashboards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {appointments.map((appointment) => (
    <AppointmentCard key={appointment.id} appointment={appointment} />
  ))}
</div>
```

### 4. Loading States for Critical Actions
```tsx
// Always show loading states for booking actions
<Button disabled={isBooking}>
  {isBooking ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Booking...
    </>
  ) : (
    "Confirm Appointment"
  )}
</Button>
```

## Integration Notes

- **Built on Radix UI** - Ensures accessibility compliance for medical applications
- **Tailwind CSS Integration** - Seamless styling with utility classes
- **TypeScript Support** - Full type safety for medical data
- **React Hook Form Compatible** - Perfect for complex medical forms
- **Next.js Optimized** - Server-side rendering support
- **Dark Mode Ready** - Professional appearance options

## Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Component Examples](https://ui.shadcn.com/examples)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS Classes](https://tailwindcss.com/docs)

**Note**: shadcn/ui is not versioned as a traditional npm package since you copy the component code directly into your project. This approach gives you complete control over the components and allows for easy customization specific to medical applications.