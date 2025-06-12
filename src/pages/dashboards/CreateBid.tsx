
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../hooks/use-toast';
import FileUpload from '../../components/FileUpload';

const CreateBid = () => {
  const [formData, setFormData] = useState({
    lotName: '',
    description: '',
    wasteType: '',
    quantity: '',
    unit: 'tons',
    location: '',
    startDate: '',
    endDate: '',
    basePrice: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a mock bid with images
    const bidData = {
      ...formData,
      images: images.map(img => img.name), // In real app, these would be uploaded URLs
      status: 'pending' // Pending admin approval
    };
    
    toast({
      title: "Bid Submitted for Approval",
      description: "Your waste listing has been submitted and is awaiting admin approval.",
    });
    console.log('Creating bid:', bidData);
    console.log('Images:', images);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file: File | null, index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      if (file) {
        newImages[index] = file;
      } else {
        newImages.splice(index, 1);
      }
      return newImages;
    });
  };

  const addImageSlot = () => {
    if (images.length < 5) {
      setImages(prev => [...prev, null as any]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Bid</CardTitle>
          <CardDescription>Post your waste for bidding by recyclers and aggregators</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="lotName">Lot Name</Label>
                <Input
                  id="lotName"
                  value={formData.lotName}
                  onChange={(e) => handleChange('lotName', e.target.value)}
                  placeholder="e.g., Industrial Plastic Waste Lot #1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="wasteType">Waste Type</Label>
                <Select value={formData.wasteType} onValueChange={(value) => handleChange('wasteType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="textile">Textile</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                  required
                />
              </div>

              <div>
                <Label htmlFor="basePrice">Base Price ($)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  placeholder="Enter base price"
                  required
                />
              </div>

              <div>
                <Label htmlFor="startDate">Auction Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Auction End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Provide detailed description of the waste material, quality, condition, etc."
                rows={4}
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Item Images (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageSlot}
                  disabled={images.length >= 5}
                >
                  Add Image
                </Button>
              </div>
              <p className="text-sm text-gray-600">Upload up to 5 images of your waste items to help bidders understand the quality and condition.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: Math.max(1, images.length) }).map((_, index) => (
                  <FileUpload
                    key={index}
                    label={`Image ${index + 1}`}
                    accept="image/*"
                    value={images[index] || null}
                    onChange={(file) => handleImageUpload(file, index)}
                    description="JPG, PNG up to 5MB"
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Submit for Approval
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateBid;
