import { Settings } from 'lucide-react';
import { CreateShowForm } from '@/components/admin/CreateShowForm';
import { AdminShowList } from '@/components/admin/AdminShowList';

const Admin = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Create and manage shows</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CreateShowForm />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <AdminShowList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
