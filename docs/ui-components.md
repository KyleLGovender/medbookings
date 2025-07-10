# UI Components Documentation

This document provides comprehensive documentation for all reusable UI components in the MedBookings application. All components are built with React, TypeScript, and Radix UI primitives, styled with Tailwind CSS.

## Table of Contents

- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Navigation Components](#navigation-components)
- [Data Display Components](#data-display-components)
- [Feedback Components](#feedback-components)
- [Input Components](#input-components)
- [Overlay Components](#overlay-components)
- [Utility Components](#utility-components)

---

## Form Components

### Button

A flexible button component with multiple variants and sizes.

**Location:** `src/components/ui/button.tsx`

**Props:**

- `variant`: `'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'`
- `size`: `'default' | 'sm' | 'lg' | 'icon'`
- `asChild`: `boolean` - Renders as child component when true

**Example:**

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">
  Click me
</Button>

<Button variant="outline" size="sm">
  Secondary action
</Button>

<Button variant="destructive">
  Delete
</Button>
```

### Form

Form components built with React Hook Form integration.

**Location:** `src/components/ui/form.tsx`

**Components:**

- `Form` - Root form provider
- `FormField` - Field wrapper with validation
- `FormItem` - Individual form item container
- `FormLabel` - Form field label
- `FormControl` - Form control wrapper
- `FormDescription` - Help text for form fields
- `FormMessage` - Error message display

**Example:**

```tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input placeholder="Enter your email" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>;
```

### Input

Standard input field component.

**Location:** `src/components/ui/input.tsx`

**Props:** Extends `React.ComponentProps<'input'>`

**Example:**

```tsx
import { Input } from '@/components/ui/input';

<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Enter password" />
```

### Textarea

Multi-line text input component.

**Location:** `src/components/ui/textarea.tsx`

**Props:** Extends `React.ComponentProps<'textarea'>`

**Example:**

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea placeholder="Enter your message" rows={4} />;
```

### Checkbox

Checkbox input component.

**Location:** `src/components/ui/checkbox.tsx`

**Props:** Extends Radix UI Checkbox props

**Example:**

```tsx
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox id="terms" />
<Label htmlFor="terms">Accept terms and conditions</Label>
```

### Radio Group

Radio button group component.

**Location:** `src/components/ui/radio-group.tsx`

**Example:**

```tsx
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
</RadioGroup>;
```

### Select

Dropdown select component.

**Location:** `src/components/ui/select.tsx`

**Example:**

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
  </SelectContent>
</Select>;
```

### Switch

Toggle switch component.

**Location:** `src/components/ui/switch.tsx`

**Example:**

```tsx
import { Switch } from '@/components/ui/switch';

<Switch />;
```

### Slider

Range slider component.

**Location:** `src/components/ui/slider.tsx`

**Example:**

```tsx
import { Slider } from '@/components/ui/slider';

<Slider defaultValue={[50]} max={100} step={1} />;
```

---

## Layout Components

### Card

Flexible card container with header, content, and footer sections.

**Location:** `src/components/ui/card.tsx`

**Components:**

- `Card` - Root container
- `CardHeader` - Header section
- `CardTitle` - Title component
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Example:**

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

### Separator

Visual separator/divider component.

**Location:** `src/components/ui/separator.tsx`

**Example:**

```tsx
import { Separator } from '@/components/ui/separator';

<Separator className="my-4" />;
```

### Aspect Ratio

Maintains aspect ratio for content.

**Location:** `src/components/ui/aspect-ratio.tsx`

**Example:**

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio';

<AspectRatio ratio={16 / 9}>
  <img src="image.jpg" alt="Description" />
</AspectRatio>;
```

### Sidebar

Comprehensive sidebar component with navigation.

**Location:** `src/components/ui/sidebar.tsx`

**Components:** Multiple sidebar-related components for layout

**Example:**

```tsx
import { Sidebar } from '@/components/ui/sidebar';

<Sidebar>
  <SidebarContent>
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Home className="h-4 w-4" />
            <span>Home</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>;
```

---

## Navigation Components

### Navigation Menu

Horizontal navigation menu component.

**Location:** `src/components/ui/navigation-menu.tsx`

**Example:**

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink>Documentation</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>;
```

### Breadcrumb

Breadcrumb navigation component.

**Location:** `src/components/ui/breadcrumb.tsx`

**Example:**

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current Page</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>;
```

### Tabs

Tab navigation component.

**Location:** `src/components/ui/tabs.tsx`

**Example:**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Tab 1 content</TabsContent>
  <TabsContent value="tab2">Tab 2 content</TabsContent>
</Tabs>;
```

---

## Data Display Components

### Table

Table component for displaying structured data.

**Location:** `src/components/ui/table.tsx`

**Components:**

- `Table` - Root table container
- `TableHeader` - Table header
- `TableBody` - Table body
- `TableFooter` - Table footer
- `TableRow` - Table row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Table caption

**Example:**

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

### Avatar

User avatar component.

**Location:** `src/components/ui/avatar.tsx`

**Example:**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>;
```

### Badge

Status badge component.

**Location:** `src/components/ui/badge.tsx`

**Props:**

- `variant`: `'default' | 'secondary' | 'destructive' | 'outline'`

**Example:**

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Active</Badge>
<Badge variant="destructive">Error</Badge>
```

### Progress

Progress bar component.

**Location:** `src/components/ui/progress.tsx`

**Example:**

```tsx
import { Progress } from '@/components/ui/progress';

<Progress value={33} className="w-full" />;
```

---

## Feedback Components

### Alert

Alert message component.

**Location:** `src/components/ui/alert.tsx`

**Example:**

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>This is an important message.</AlertDescription>
</Alert>;
```

### Toast

Toast notification components.

**Location:** `src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`

**Example:**

```tsx
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Your action was completed successfully.',
});

// Add to app root
<Toaster />;
```

### Spinner

Loading spinner component.

**Location:** `src/components/ui/spinner.tsx`

**Example:**

```tsx
import { Spinner } from '@/components/ui/spinner';

<Spinner />;
```

### Skeleton

Skeleton loading placeholder.

**Location:** `src/components/ui/skeleton.tsx`

**Example:**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-[20px] w-[100px] rounded-full" />;
```

---

## Input Components

### Calendar

Calendar picker component.

**Location:** `src/components/ui/calendar.tsx`

**Example:**

```tsx
import { Calendar } from '@/components/ui/calendar';

const [date, setDate] = useState<Date | undefined>(new Date());

<Calendar mode="single" selected={date} onSelect={setDate} />;
```

### Date Picker

Date picker with input field.

**Location:** `src/components/ui/date-picker.tsx`

**Example:**

```tsx
import { DatePicker } from '@/components/ui/date-picker';

<DatePicker />;
```

### Time Picker

Time picker component.

**Location:** `src/components/ui/time-picker.tsx`

**Example:**

```tsx
import { TimePicker } from '@/components/ui/time-picker';

<TimePicker />;
```

### Phone Input

Phone number input with country selection.

**Location:** `src/components/ui/phone-input.tsx`

**Example:**

```tsx
import { PhoneInput } from '@/components/ui/phone-input';

<PhoneInput placeholder="Enter phone number" />;
```

---

## Overlay Components

### Dialog

Modal dialog component.

**Location:** `src/components/ui/dialog.tsx`

**Components:**

- `Dialog` - Root dialog container
- `DialogTrigger` - Trigger button
- `DialogContent` - Dialog content
- `DialogHeader` - Dialog header
- `DialogTitle` - Dialog title
- `DialogDescription` - Dialog description
- `DialogFooter` - Dialog footer

**Example:**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Make changes to your profile here.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">{/* Content */}</div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### Alert Dialog

Confirmation dialog component.

**Location:** `src/components/ui/alert-dialog.tsx`

**Example:**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

### Sheet

Slide-out panel component.

**Location:** `src/components/ui/sheet.tsx`

**Example:**

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Are you absolutely sure?</SheetTitle>
      <SheetDescription>This action cannot be undone.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>;
```

### Popover

Popover component for contextual content.

**Location:** `src/components/ui/popover.tsx`

**Example:**

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Dimensions</h4>
        <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
      </div>
    </div>
  </PopoverContent>
</Popover>;
```

### Tooltip

Tooltip component for contextual help.

**Location:** `src/components/ui/tooltip.tsx`

**Example:**

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Add to library</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

### Dropdown Menu

Dropdown menu component.

**Location:** `src/components/ui/dropdown-menu.tsx`

**Example:**

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

### Context Menu

Right-click context menu component.

**Location:** `src/components/ui/context-menu.tsx`

**Example:**

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

<ContextMenu>
  <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent className="w-64">
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Settings</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>;
```

---

## Utility Components

### Command

Command palette component.

**Location:** `src/components/ui/command.tsx`

**Example:**

```tsx
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

<Command>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
      <CommandItem>Search Emoji</CommandItem>
      <CommandItem>Calculator</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>;
```

### Scroll Area

Custom scrollable area component.

**Location:** `src/components/ui/scroll-area.tsx`

**Example:**

```tsx
import { ScrollArea } from '@/components/ui/scroll-area';

<ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
  <div className="space-y-4">{/* Content */}</div>
</ScrollArea>;
```

### Collapsible

Collapsible content component.

**Location:** `src/components/ui/collapsible.tsx`

**Example:**

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

<Collapsible>
  <CollapsibleTrigger>Can I use this in my project?</CollapsibleTrigger>
  <CollapsibleContent>Yes. Free to use for personal and commercial projects.</CollapsibleContent>
</Collapsible>;
```

### Label

Form label component.

**Location:** `src/components/ui/label.tsx`

**Example:**

```tsx
import { Label } from '@/components/ui/label';

<Label htmlFor="email">Email</Label>;
```

---

## Design System Notes

### Styling

- All components use Tailwind CSS for styling
- Components support className prop for custom styling
- Design tokens are defined in `tailwind.config.ts`

### Accessibility

- Components are built with accessibility in mind
- Proper ARIA attributes are included
- Keyboard navigation is supported where applicable

### Theming

- Components support dark/light theme switching
- Theme colors are defined using CSS custom properties
- Use `next-themes` for theme management

### Best Practices

- Always use the provided components instead of building custom ones
- Extend components using the `className` prop
- Follow the established patterns when creating new components
- Test components in both light and dark themes
