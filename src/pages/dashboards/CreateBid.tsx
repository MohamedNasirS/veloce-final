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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    lotName: '',
    description: '',
    wasteType: '',
    quantity: '',
    unit: 'tons',
    location: '',
    startDate: '',
    endDate: '',
    basePrice: '',
    minIncrementPercent: '',
    creatorId: localStorage.getItem('userId') || '',
  });

  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    images.forEach((img) => {
      if (img) data.append('images', img);
    });

    await fetch('http://0.0.0.0:3001/api/bids', {
      method: 'POST',
      body: data,
    });

    toast({
      title: "Bid Submitted",
      description: "Your bid has been submitted successfully.",
    });

    // Reset form
    setFormData({
      lotName: '',
      description: '',
      wasteType: '',
      quantity: '',
      unit: 'tons',
      location: '',
      startDate: '',
      endDate: '',
      basePrice: '',
      minIncrementPercent: '',
      creatorId: localStorage.getItem('userId') || '',
    });
    setImages([]);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file: File | null, index: number) => {
    setImages((prev) => {
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
      setImages((prev) => [...prev, null as any]);
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
                  required
                />
              </div>

              <div>
                <Label htmlFor="basePrice">Base Price (₹)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleChange('basePrice', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="minIncrementPercent">Min Increment %</Label>
                <Input
                  id="minIncrementPercent"
                  type="number"
                  value={formData.minIncrementPercent || ''}
                  onChange={(e) => handleChange('minIncrementPercent', e.target.value)}
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
                rows={4}
                required
              />
            </div>

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
              <p className="text-sm text-gray-600">Upload up to 5 images of your waste items.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((img, index) => (
                  <FileUpload
                    key={index}
                    label={`Image ${index + 1}`}
                    accept="image/*"
                    value={img || null}
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
