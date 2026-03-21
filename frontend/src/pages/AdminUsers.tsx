import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Mail, Phone } from "lucide-react";

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "+1-234-567-8900", bookings: 5, status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+1-234-567-8901", bookings: 3, status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", phone: "+1-234-567-8902", bookings: 8, status: "Active" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", phone: "+1-234-567-8903", bookings: 2, status: "Inactive" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com", phone: "+1-234-567-8904", bookings: 6, status: "Active" },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Users Management</h2>
        <p className="text-muted-foreground">Manage registered users</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Users</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
            <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">Add User</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="bg-secondary border-border hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{user.name}</h3>
                      <Badge className={user.status === "Active" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={16} />
                      <span>{user.phone}</span>
                    </div>
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{user.bookings}</span>
                      <span className="text-muted-foreground"> bookings</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-border text-foreground hover:bg-muted">
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 border-border text-rose hover:bg-rose/10">
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
