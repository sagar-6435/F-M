import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Reply } from "lucide-react";
import { useState } from "react";

const AdminMessages = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const messages = [
    {
      id: 1,
      from: "John Doe",
      email: "john@example.com",
      subject: "Inquiry about private theatre booking",
      message: "I would like to book a private theatre for my company event...",
      date: "2024-03-21",
      read: false,
    },
    {
      id: 2,
      from: "Jane Smith",
      email: "jane@example.com",
      subject: "Question about group discounts",
      message: "Do you offer any discounts for large groups?",
      date: "2024-03-20",
      read: true,
    },
    {
      id: 3,
      from: "Bob Johnson",
      email: "bob@example.com",
      subject: "Booking confirmation",
      message: "Thank you for confirming my booking!",
      date: "2024-03-19",
      read: true,
    },
  ];

  const filteredMessages = messages.filter(
    (msg) =>
      msg.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Messages</h2>
        <p className="text-muted-foreground">Manage customer messages and inquiries</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Messages</CardTitle>
          <CardDescription className="text-muted-foreground">View and respond to customer messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg border transition-colors ${
                  msg.read ? "bg-card border-border" : "bg-secondary border-gold/30"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{msg.from}</h3>
                    <p className="text-sm text-muted-foreground">{msg.email}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{msg.date}</span>
                </div>
                <p className="font-medium text-foreground mb-2">{msg.subject}</p>
                <p className="text-muted-foreground mb-4">{msg.message}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted">
                    <Reply size={16} className="mr-1" />
                    Reply
                  </Button>
                  <Button size="sm" variant="outline" className="border-border text-rose hover:bg-rose/10">
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMessages;
