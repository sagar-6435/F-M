import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const GalleryPage = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Sample gallery data - replace with actual images
  const galleryImages = [
    {
      id: 1,
      src: "/placeholder.svg",
      alt: "Past Event 1",
      title: "Wedding Celebration",
      date: "March 2024",
    },
    {
      id: 2,
      src: "/placeholder.svg",
      alt: "Past Event 2",
      title: "Corporate Event",
      date: "February 2024",
    },
    {
      id: 3,
      src: "/placeholder.svg",
      alt: "Past Event 3",
      title: "Birthday Party",
      date: "January 2024",
    },
    {
      id: 4,
      src: "/placeholder.svg",
      alt: "Past Event 4",
      title: "Anniversary Bash",
      date: "December 2023",
    },
    {
      id: 5,
      src: "/placeholder.svg",
      alt: "Past Event 5",
      title: "Family Gathering",
      date: "November 2023",
    },
    {
      id: 6,
      src: "/placeholder.svg",
      alt: "Past Event 6",
      title: "Engagement Party",
      date: "October 2023",
    },
  ];

  const handlePrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1
      );
    }
  };

  const handleNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl italic text-primary mb-4">
            Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore memories from our past events
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className="group relative overflow-hidden rounded-lg cursor-pointer bg-muted aspect-square"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-4">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-sm text-gray-200">{image.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage !== null && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>

              {/* Image */}
              <img
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                className="w-full h-auto rounded-lg"
              />

              {/* Image info */}
              <div className="mt-4 text-center text-white">
                <h3 className="text-xl font-semibold">
                  {galleryImages[selectedImage].title}
                </h3>
                <p className="text-gray-300">{galleryImages[selectedImage].date}</p>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>

                <span className="text-white text-sm">
                  {selectedImage + 1} / {galleryImages.length}
                </span>

                <Button
                  onClick={handleNext}
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
