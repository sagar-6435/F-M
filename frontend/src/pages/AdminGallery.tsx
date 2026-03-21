import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Edit, Trash2, Search } from "lucide-react";

const AdminGallery = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const galleryItems = [
    { id: 1, title: "Theatre Interior", image: "/src/assets/gallery-1.jpg", uploadDate: "2024-03-15", size: "2.4 MB" },
    { id: 2, title: "Stage Setup", image: "/src/assets/gallery-2.jpg", uploadDate: "2024-03-14", size: "1.8 MB" },
    { id: 3, title: "Audience View", image: "/src/assets/gallery-3.jpg", uploadDate: "2024-03-13", size: "2.1 MB" },
    { id: 4, title: "Lighting System", image: "/src/assets/gallery-4.jpg", uploadDate: "2024-03-12", size: "1.9 MB" },
  ];

  const filteredItems = galleryItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Gallery Management</h2>
        <p className="text-muted-foreground">Manage gallery images</p>
      </div>

      <Card className="mb-8 bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Upload New Image</CardTitle>
          <CardDescription className="text-muted-foreground">Add new images to the gallery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-gold transition-colors cursor-pointer">
            <Upload className="mx-auto mb-4 text-muted-foreground" size={32} />
            <p className="text-muted-foreground mb-2">Drag and drop your image here or click to browse</p>
            <p className="text-sm text-muted-foreground">Supported formats: JPG, PNG, WebP (Max 5MB)</p>
            <Button className="mt-4 bg-gold hover:bg-gold/90 text-primary-foreground">Select Image</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Gallery Images</CardTitle>
          <CardDescription className="text-muted-foreground">All uploaded gallery images</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-secondary border-border hover:shadow-lg transition-shadow">
                <div className="bg-muted h-48 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/300x200?text=" + item.title;
                    }}
                  />
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-2 text-foreground">{item.title}</h3>
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Uploaded: {item.uploadDate}</p>
                    <p>Size: {item.size}</p>
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

export default AdminGallery;
