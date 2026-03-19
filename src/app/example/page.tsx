import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/theme/shadcn/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/theme/shadcn/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/theme/shadcn/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/theme/shadcn/avatar"
import { Badge } from "@/components/theme/shadcn/badge"
import { Button } from "@/components/theme/shadcn/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/theme/shadcn/card"
import { Checkbox } from "@/components/theme/shadcn/checkbox"
import { Input } from "@/components/theme/shadcn/input"
import { Label } from "@/components/theme/shadcn/label"
import { Progress } from "@/components/theme/shadcn/progress"
import { RadioGroup, RadioGroupItem } from "@/components/theme/shadcn/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/theme/shadcn/select"
import { Separator } from "@/components/theme/shadcn/separator"
import { Skeleton } from "@/components/theme/shadcn/skeleton"
import { Slider } from "@/components/theme/shadcn/slider"
import { Switch } from "@/components/theme/shadcn/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/theme/shadcn/tabs"
import { Textarea } from "@/components/theme/shadcn/textarea"
import { Toggle } from "@/components/theme/shadcn/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/theme/shadcn/tooltip"
import "./rawvault-theme.css"
import {
  Cloud,
  CreditCard,
  Github,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  PlusCircle,
  Settings,
  User,
  UserPlus,
  Users,
  Search,
  FolderOpen,
  Share,
  BadgeCheck,
  CircleQuestionMark,
  Archive,
  Bell,
  LayoutGrid,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Download,
  MoreVertical
} from "lucide-react"

export default function ExamplePage() {
  return (
    <div className="bg-background text-foreground tracking-tight rawvault-light" data-theme="rawvault-light">
      {/* Set the theme specifically for this example wrapper if it is injected globally, or let it cascade. 
          Assuming we inject data-theme="rawvault-light" to globals.css */}
      
      {/* SideNavBar (Execution from JSON) */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-muted/20 p-6 backdrop-blur-xl">
        <div className="mb-10 px-4">
          <h1 className="font-heading text-xl font-bold tracking-tight text-primary">RawVault</h1>
          <p className="text-xs font-medium text-muted-foreground">Premium Storage</p>
        </div>
        <nav className="flex-1 space-y-2">
          {/* Active State: Dashboard */}
          <a className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-sm transition-colors" href="#">
            <PlusCircle className="h-4 w-4" />
            Dashboard
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground" href="#">
            <FolderOpen className="h-4 w-4" />
            Files
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground" href="#">
            <Share className="h-4 w-4" />
            Shared
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground" href="#">
            <BadgeCheck className="h-4 w-4" />
            Security
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground" href="#">
            <Settings className="h-4 w-4" />
            Settings
          </a>
        </nav>
        <div className="mt-auto space-y-4 border-t border-border pt-6">
          <div className="space-y-1">
            <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href="#">
              <CircleQuestionMark className="h-4 w-4" />
              Support
            </a>
            <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href="#">
              <Archive className="h-4 w-4" />
              Archive
            </a>
          </div>
          <Button className="w-full shadow-md hover:opacity-90">Upgrade Plan</Button>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed left-64 right-0 top-0 z-40 flex h-16 items-center justify-between bg-background/80 px-8 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-8">
          <div className="relative w-96 max-w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-full rounded-lg border-none bg-muted pl-10 pr-4 focus-visible:ring-2 focus-visible:ring-primary/20" placeholder="Search files, folders, or settings..." />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-sans text-muted-foreground">⌘</kbd>
              <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-sans text-muted-foreground">K</kbd>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a className="border-b-2 border-primary py-5 text-sm font-semibold text-primary" href="#">Activity</a>
            <a className="text-sm text-muted-foreground transition-all hover:text-foreground" href="#">Analytics</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="mr-4 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground"><Bell className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground"><LayoutGrid className="h-5 w-5" /></Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost">Invite</Button>
            <Button className="gap-2 shadow-sm"><Upload className="h-4 w-4" /> Upload File</Button>
            <Avatar className="ml-2 h-8 w-8 border-2 border-background shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-screen pl-64 pt-16">
        <div className="mx-auto max-w-[1600px] space-y-12 p-12">
          
          <section className="space-y-1">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Good Morning, Alexander</h2>
            <p className="text-muted-foreground">Here is a summary of your digital assets and storage health.</p>
          </section>

          {/* Top Grid: Storage & Quick Actions */}
          <div className="grid grid-cols-12 gap-8">
            <Card className="col-span-12 flex flex-col items-center gap-12 p-8 lg:col-span-8 md:flex-row">
              <div className="relative flex h-48 w-48 shrink-0 flex-col items-center justify-center">
                {/* Circular Progress (mock) */}
                <div className="absolute inset-0 rounded-full border-[12px] border-muted"></div>
                <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-r-transparent transform -rotate-45"></div>
                <div className="absolute inset-0 rounded-full border-[12px] border-secondary border-b-transparent border-l-transparent transform rotate-45 opacity-60"></div>
                <span className="text-3xl font-bold">75%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Used</span>
              </div>
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium text-muted-foreground">Cloud Files</span>
                    </div>
                    <p className="text-xl font-bold">756.4 GB</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-secondary"></div>
                      <span className="text-sm font-medium text-muted-foreground">System Cache</span>
                    </div>
                    <p className="text-xl font-bold">12.1 GB</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                      <span className="text-sm font-medium text-muted-foreground">Available</span>
                    </div>
                    <p className="text-xl font-bold">231.5 GB</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent"></div>
                      <span className="text-sm font-medium text-muted-foreground">Shared</span>
                    </div>
                    <p className="text-xl font-bold">45.2 GB</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex -space-x-2">
                    <Avatar className="h-8 w-8 border-2 border-background"><AvatarFallback>S</AvatarFallback></Avatar>
                    <Avatar className="h-8 w-8 border-2 border-background"><AvatarFallback>M</AvatarFallback></Avatar>
                    <Avatar className="h-8 w-8 border-2 border-background"><AvatarFallback>D</AvatarFallback></Avatar>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold">+12</div>
                  </div>
                  <Button variant="link" className="font-semibold text-primary">Manage Storage Plan</Button>
                </div>
              </div>
            </Card>

            {/* Quick Actions / Analytics */}
            <Card className="col-span-12 flex flex-col justify-between p-8 lg:col-span-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Quick Upload</h3>
                <p className="text-xs text-muted-foreground">Drag and drop files to instantly encrypt and store them in your primary vault.</p>
              </div>
              <div className="group mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background/40 p-8 transition-all hover:bg-background">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Drop files to RawVault</span>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Shadcn Components Showcase */}
          <section className="space-y-8">
            <h3 className="font-heading text-2xl font-bold tracking-tight">Shadcn Components Toolkit</h3>
            <p className="text-muted-foreground mb-4">All core components successfully configured with the requested premium theme.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Buttons */}
              <Card>
                <CardHeader><CardTitle>Buttons</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button disabled><Settings className="mr-2 h-4 w-4 animate-spin"/> Loading</Button>
                </CardContent>
              </Card>

              {/* Form Controls */}
              <Card>
                <CardHeader><CardTitle>Form Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" placeholder="Email" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="airplane-mode" />
                    <Label htmlFor="airplane-mode">Airplane Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms">Accept terms and conditions</Label>
                  </div>
                  <Slider defaultValue={[33]} max={100} step={1} />
                </CardContent>
              </Card>

              {/* Data Display */}
              <Card>
                <CardHeader><CardTitle>Data Display</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                  <Progress value={60} className="w-[60%]" />
                  <Skeleton className="w-[100px] h-[20px] rounded-full" />
                </CardContent>
              </Card>

              {/* Navigation / Selection */}
              <Card>
                <CardHeader><CardTitle>Selection & Nav</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>

                  <Tabs defaultValue="account" className="w-[400px]">
                    <TabsList>
                      <TabsTrigger value="account">Account</TabsTrigger>
                      <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">Make changes here.</TabsContent>
                    <TabsContent value="password">Change password here.</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Overlays */}
              <Card>
                <CardHeader><CardTitle>Overlays & Alerts</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="outline" type="button">
                            Hover Tooltip
                          </Button>
                        }
                      />
                      <TooltipContent>
                        <p>Add to library</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="outline" type="button">
                          Show Dialog
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Accordion</CardTitle></CardHeader>
                <CardContent>
                  <Accordion className="w-full" defaultValue={["item-1"]}>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Is it accessible?</AccordionTrigger>
                      <AccordionContent>
                        Yes. It adheres to the WAI-ARIA design pattern.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Is it styled?</AccordionTrigger>
                      <AccordionContent>
                        Yes. It comes with default styles that matches the other components.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
