import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const joinTeam = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to join a team.'
    );
  }

  const userId = context.auth.uid;
  const shareCode = data.shareCode;

  if (!shareCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a shareCode.'
    );
  }

  try {
    // Find the team with the provided share code
    const teamsRef = db.collection('teams');
    const q = teamsRef.where('shareCode', '==', shareCode).limit(1);
    const snapshot = await q.get();

    if (snapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Team not found with that share code.'
      );
    }

    const teamDoc = snapshot.docs[0];
    const teamId = teamDoc.id;
    const teamData = teamDoc.data();

    // Check if the user is already a member
    if (teamData.members && teamData.members.includes(userId)) {
      return { message: `You are already a member of team "${teamData.name}".` };
    }

    // Add the user to the team's members array
    const teamRef = db.collection('teams').doc(teamId);
    await teamRef.update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });

    return { message: `Successfully joined team "${teamData.name}".` };

  } catch (error: any) {
    console.error('Error joining team:', error);

    // Re-throw Firebase Functions errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Throw a generic error for unexpected issues
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while joining the team.'
    );
  }
});
