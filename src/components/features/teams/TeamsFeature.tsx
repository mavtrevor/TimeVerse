
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, Settings, BellRing } from 'lucide-react';

export default function TeamsFeature() {
  // This is a placeholder. In a real application, you'd fetch user's teams from Firestore.
  const [teams, setTeams] = React.useState([
    { id: '1', name: 'Family', members: 4, activeAlarms: 2 },
    { id: '2', name: 'Work Project Alpha', members: 8, activeAlarms: 5 },
    { id: '3', name: 'Study Group', members: 3, activeAlarms: 1 },
  ]);
  const [isCreatingTeam, setIsCreatingTeam] = React.useState(false); // Placeholder state

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Team Management</h2>
        <Button onClick={() => setIsCreatingTeam(true)} disabled>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Team (WIP)
        </Button>
      </div>

      {isCreatingTeam && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Create New Team (Placeholder)</CardTitle>
            <CardDescription>Team creation UI will go here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Imagine a form here to name your team and invite members.
            </p>
            <Button variant="outline" onClick={() => setIsCreatingTeam(false)} className="mt-4">
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
          <CardDescription>Manage your teams and their shared alarms.</CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 && !isCreatingTeam ? (
            <p className="text-muted-foreground text-center py-8">
              You are not part of any teams yet, or no teams have been created.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card key={team.id} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate" title={team.name}>{team.name}</span>
                      <Button variant="ghost" size="icon" disabled>
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Manage Team</span>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{team.members} Members</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <BellRing className="mr-2 h-4 w-4" />
                      <span>{team.activeAlarms} Active Team Alarms</span>
                    </div>
                  </CardContent>
                  <CardContent className="pt-0">
                     <Button variant="outline" className="w-full mt-2" disabled>
                        View Team Details (WIP)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>About Team Alarms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This "Teams" section is where you will manage groups for shared alarms. To fully implement this feature, the following backend and UI components would be needed:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>User Authentication:</strong> Secure sign-up and login for users (e.g., using Firebase Authentication).</li>
            <li><strong>Database Setup (Firestore):</strong> Collections for storing user profiles, team details (name, members), and shared team alarms.</li>
            <li><strong>Team Creation UI:</strong> Forms to create new teams, invite members (e.g., by email).</li>
            <li><strong>Member Management:</strong> Ability to add/remove team members and assign roles (e.g., admin, member).</li>
            <li><strong>Shared Alarm Logic:</strong>
              <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                <li>Modifying the alarm creation form to select a team for the alarm.</li>
                <li>Backend logic (e.g., Firebase Cloud Functions) to check for due team alarms.</li>
                <li>Real-time notifications (e.g., using Firestore listeners or FCM push notifications) to alert all team members when a shared alarm rings.</li>
              </ul>
            </li>
            <li><strong>Permissions:</strong> Rules to control who can create/edit team alarms or manage team settings.</li>
          </ul>
          <p>
            Currently, the "Alarm Type" selector in the alarm creation dialog is a conceptual UI element. True team functionality requires the backend services mentioned above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
