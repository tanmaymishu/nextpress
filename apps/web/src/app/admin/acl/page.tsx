'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UsersManagement from '@/components/admin/UsersManagement';
import RolesManagement from '@/components/admin/RolesManagement';

export default function ACLManagementPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Access Control Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, roles, and permissions for your application
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create, edit, and manage user accounts and their role assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Create, edit, and manage roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RolesManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}