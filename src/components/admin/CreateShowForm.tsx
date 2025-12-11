import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const showSchema = z.object({
  name: z.string().trim().min(1, 'Show name is required').max(100, 'Name must be less than 100 characters'),
  startTime: z.string().min(1, 'Start time is required'),
  totalSeats: z.number().int().min(1, 'At least 1 seat is required').max(500, 'Maximum 500 seats allowed'),
});

export function CreateShowForm() {
  const { createShow, loading } = useBooking();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = showSchema.safeParse({
      name,
      startTime,
      totalSeats: parseInt(totalSeats) || 0,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    try {
      await createShow(name, new Date(startTime).toISOString(), parseInt(totalSeats));
      toast({
        title: 'Show Created!',
        description: `"${name}" has been created successfully.`,
      });
      setName('');
      setStartTime('');
      setTotalSeats('');
    } catch (err) {
      toast({
        title: 'Failed to Create Show',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="card-glow border-border/50">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Create New Show
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Show Name</Label>
            <Input
              id="name"
              placeholder="e.g., Evening Concert"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalSeats">Total Seats</Label>
            <Input
              id="totalSeats"
              type="number"
              min="1"
              max="500"
              placeholder="e.g., 100"
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            {errors.totalSeats && <p className="text-xs text-destructive">{errors.totalSeats}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Show
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
