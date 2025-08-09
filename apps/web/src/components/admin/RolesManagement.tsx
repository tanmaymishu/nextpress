'use client';

import { useState } from 'react';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/api/useRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Role } from '@repo/shared';
import { Pencil, Trash2, Plus, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RolesManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: rolesResponse, isLoading: rolesLoading, error: rolesError } = useRoles({
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,
  });

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoleMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
      });
      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        name: formData.name,
        description: formData.description,
      });
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });
      setIsEditOpen(false);
      setSelectedRole(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync(role.id);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setIsEditOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="text-destructive p-4">
        Error loading roles: {rolesError.message}
      </div>
    );
  }

  const roles = rolesResponse?.data || [];
  const totalRoles = rolesResponse?.meta?.total || 0;
  const totalPages = Math.ceil(totalRoles / pageSize);

  return (
    <div className="space-y-4">
      {/* Header with search and create button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateRole}>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Add a new role to the system. Permissions can be assigned separately.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. moderator, editor, viewer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the role's purpose"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoleMutation.isPending}>
                  {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>User Count</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>{role.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {role.description || 'No description'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 3).map((permission) => (
                      <Badge key={permission.id} variant="outline">
                        {permission.name}
                      </Badge>
                    ))}
                    {role.permissions && role.permissions.length > 3 && (
                      <Badge variant="outline">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                    {!role.permissions?.length && (
                      <span className="text-muted-foreground text-sm">No permissions</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {role.userCount || 0} users
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(role.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="text-destructive hover:text-destructive"
                      disabled={role.name === 'admin'} // Prevent deleting admin role
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRoles)} of {totalRoles} roles
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateRole}>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role information. Permissions can be managed separately.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Role Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the role's purpose"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}