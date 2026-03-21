import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const AdminDashboard = () => {
  const bookingData = [
    { month: "Jan", bookings: 40, revenue: 2400 },
    { month: "Feb", bookings: 35, revenue: 2210 },
    { month: "Mar", bookings: 50, revenue: 2290 },
    { month: "Apr", bookings: 45, revenue: 2000 },
    { month: "May", bookings: 60, revenue: 2181 },
    { month: "Jun", bookings: 55, revenue: 2500 },
  ];

  const stats = [
    { label: "Total Bookings", value: "285", change: "+12%" },
    { label: "Total Revenue", value: "$14,581", change: "+8%" },
    { label: "Active Users", value: "1,234", change: "+5%" },
    { label: "Pending Bookings", value: "23", change: "-2%" },
  ];

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-gold mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Bookings Overview</CardTitle>
            <CardDescription className="text-muted-foreground">Monthly booking trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="bookings" fill="hsl(var(--gold))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Trend</CardTitle>
            <CardDescription className="text-muted-foreground">Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--gold))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="bg-secondary">
              <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-4">
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-foreground">Booking #{1000 + item}</p>
                      <p className="text-sm text-muted-foreground">Theatre Experience - 2 hours</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">$250</p>
                      <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-4">
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="p-4 bg-secondary rounded-lg border border-border">
                    <p className="font-medium text-foreground">Message from User {item}</p>
                    <p className="text-sm text-muted-foreground mt-1">Inquiry about private theatre booking...</p>
                    <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
