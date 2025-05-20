
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Users, Settings, BellRing, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Placeholder type for Team, eventually move to src/types
interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  // activeAlarms?: number; // For future use
}

export default function TeamsFeature() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Placeholder for actual teams fetched from Firestore
  const [teams, setTeams] = React.useState<Team[]>([]); // This will be populated from Firestore later

  const handleCreateTeam = async () => {
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be logged in to create a team.", variant: "destructive" });
      return;
    }
    if (!newTeamName.trim()) {
      toast({ title: "Team Name Required", description: "Please enter a name for your team.", variant: "destructive" });
      return;
    }

    setIsCreatingTeam(true);
    try {
      const teamsCollectionRef = collection(db, "teams");
      await addDoc(teamsCollectionRef, {
        name: newTeamName.trim(),
        ownerId: user.uid,
        members: [user.uid], // Initially, only the creator is a member
        createdAt: serverTimestamp(),
      });
      toast({ title: "Team Created!", description: `Team "${newTeamName.trim()}" successfully created.` });
      setNewTeamName('');
      // TODO: Refresh the teams list after creation
    } catch (error) {
      console.error("Error creating team:", error);
      toast({ title: "Error Creating Team", description: "Could not create the team. Please try again.", variant: "destructive" });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <p className="text-muted-foreground">Loading user information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 md:p-6 space-y-6 text-center">
        <Card className="shadow-md max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <LogIn className="mr-2 h-6 w-6" /> Please Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Sign in to create and manage your teams for shared alarms.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create New Team</CardTitle>
          <CardDescription>Give your new team a name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newTeamName">Team Name</Label>
            <Input
              id="newTeamName"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g., Morning Workout Crew"
              disabled={isCreatingTeam}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateTeam} disabled={isCreatingTeam || !newTeamName.trim()}>
            {isCreatingTeam ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Team
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Teams</CardTitle>
          <CardDescription>Manage your teams and their shared alarms.</CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't created or joined any teams yet. Create one above!
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
                      <span>{team.members.length} Members</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <BellRing className="mr-2 h-4 w-4" />
                      {/* Placeholder for active alarms count */}
                      <span>0 Active Team Alarms</span>
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
            This "Teams" section is where you will manage groups for shared alarms. Fully implementing this feature involves:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>User Authentication:</strong> Secure sign-up and login for users (Firebase Authentication is now set up!).</li>
            <li><strong>Database Setup (Firestore):</strong> Collections for storing user profiles, team details (name, members), and shared team alarms. You've initialized Firestore and can now create teams.</li>
            <li><strong>Team Creation & Management UI:</strong> Forms to create teams, invite members (e.g., by email), and manage roles. (Creation part added).</li>
            <li><strong>Member Management:</strong> Ability to add/remove team members. (Next step)</li>
            <li><strong>Shared Alarm Logic:</strong>
              <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                <li>Modifying the alarm creation form to select a team.</li>
                <li>Backend logic (e.g., Firebase Cloud Functions) to check for due team alarms.</li>
                <li>Real-time notifications (e.g., using Firestore listeners or FCM push notifications) to alert all team members.</li>
              </ul>
            </li>
            <li><strong>Permissions & Security Rules:</strong> Firestore rules to control data access. (Basic rules provided).</li>
          </ul>
          <p>
            The "Alarm Type" selector in the alarm creation dialog is a conceptual UI element. True team alarm functionality requires further backend and UI development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
