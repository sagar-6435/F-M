import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Eye } from "lucide-react";

const AdminBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const bookings = [
    { id: 1001, user: "John Doe", service: "Theatre Experience", date: "2024-03-25", amount: "$250", status: "Confirmed" },
    { id: 1002, user: "Jane Smith", service: "Private Theatre", date: "2024-03-26", amount: "$500", status: "Pending" },
    { id: 1003, user: "Bob Johnson", service: "Party Theatre", date: "2024-03-27", amount: "$800", status: "Confirmed" },
    { id: 1004, user: "Alice Brown", service: "Theatre Experience", date: "2024-03-28", amount: "$250", status: "Cancelled" },
    { id: 1005, user: "Charlie Wilson", service: "Private Theatre", date: "2024-03-29", amount: "$500", status: "Pending" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Bookings Management</h2>
        <p className="text-muted-foreground">Manage all customer bookings</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Bookings</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage customer bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by booking ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
            <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">Add Booking</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-3 px-4 text-foreground">#{booking.id}</td>
                    <td className="py-3 px-4 text-foreground">{booking.user}</td>
                    <td className="py-3 px-4 text-foreground">{booking.service}</td>
                    <td className="py-3 px-4 text-foreground">{booking.date}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{booking.amount}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose hover:text-rose/80">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
