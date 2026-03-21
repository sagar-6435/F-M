import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: "Theatre Experience",
    email: "admin@theatre.com",
    phone: "+1-234-567-8900",
    emailNotifications: true,
    maintenanceMode: false,
    autoConfirmBookings: false,
  });

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Settings saved:", settings);
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">General Settings</CardTitle>
            <CardDescription className="text-muted-foreground">Basic application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-foreground">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Contact Phone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Feature Settings</CardTitle>
            <CardDescription className="text-muted-foreground">Enable or disable features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="text-foreground">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(value) => handleChange("emailNotifications", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode" className="text-foreground">Maintenance Mode</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(value) => handleChange("maintenanceMode", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoConfirmBookings" className="text-foreground">Auto Confirm Bookings</Label>
              <Switch
                id="autoConfirmBookings"
                checked={settings.autoConfirmBookings}
                onCheckedChange={(value) => handleChange("autoConfirmBookings", value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card className="mt-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Security Settings</CardTitle>
          <CardDescription className="text-muted-foreground">Manage security and access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
            <Input id="currentPassword" type="password" placeholder="••••••••" className="bg-secondary border-border text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
            <Input id="newPassword" type="password" placeholder="••••••••" className="bg-secondary border-border text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" className="bg-secondary border-border text-foreground" />
          </div>

          <Button variant="outline" className="border-border text-foreground hover:bg-muted">Change Password</Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="mt-8 flex gap-4">
        <Button onClick={handleSave} size="lg" className="bg-gold hover:bg-gold/90 text-primary-foreground">
          Save Settings
        </Button>
        <Button variant="outline" size="lg" className="border-border text-foreground hover:bg-muted">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
