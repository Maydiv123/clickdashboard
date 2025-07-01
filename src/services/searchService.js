import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export const searchAllCollections = async (searchQuery) => {
  const queryLower = searchQuery.toLowerCase();
  const results = [];

  console.log('Starting search for:', searchQuery);

  try {
    // First, let's test if we can access any collection at all
    console.log('Testing collection access...');
    const testRef = collection(db, 'user_data');
    const testQuery = query(testRef, limit(1));
    const testSnapshot = await getDocs(testQuery);
    console.log('Test access successful, found documents:', testSnapshot.docs.length);

    // Search in users collection
    console.log('Searching users...');
    const usersResults = await searchUsers(queryLower);
    console.log('Users results:', usersResults);
    results.push(...usersResults);

    // Search in teams collection
    console.log('Searching teams...');
    const teamsResults = await searchTeams(queryLower);
    console.log('Teams results:', teamsResults);
    results.push(...teamsResults);

    // Search in petrol_pumps collection
    console.log('Searching petrol pumps...');
    const petrolPumpsResults = await searchPetrolPumps(queryLower);
    console.log('Petrol pumps results:', petrolPumpsResults);
    results.push(...petrolPumpsResults);

    // Search in petrol_pump_requests collection
    console.log('Searching requests...');
    const requestsResults = await searchPetrolPumpRequests(queryLower);
    console.log('Requests results:', requestsResults);
    results.push(...requestsResults);

    console.log('Total results before sorting:', results.length);
    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = sortResultsByRelevance(results, queryLower);
    console.log('Final sorted results:', sortedResults);
    return sortedResults;
  } catch (error) {
    console.error('Error searching collections:', error);
    return [];
  }
};

const searchUsers = async (searchTerm) => {
  try {
    console.log('Searching users with query:', searchTerm);
    const usersRef = collection(db, 'user_data');
    console.log('Users collection reference created');
    
    // Try without ordering first to avoid index issues
    const allUsersQuery = query(usersRef, limit(50));
    const allSnapshot = await getDocs(allUsersQuery);
    console.log('Total users in collection:', allSnapshot.docs.length);
    
    if (allSnapshot.docs.length > 0) {
      console.log('Sample user data:', allSnapshot.docs[0].data());
    }
    
    const mappedUsers = allSnapshot.docs.map(doc => {
      const userData = doc.data();
      console.log('Raw user data for', doc.id, ':', userData);
      return {
        id: doc.id,
        ...userData,
        type: 'user',
        displayName: userData.name || userData.displayName || 'Unknown User',
        description: userData.email || userData.mobile || '',
        icon: '👤'
      };
    });
    
    console.log('Mapped users:', mappedUsers.length);
    
    const filteredUsers = mappedUsers.filter(user => {
      console.log('Checking user:', user.displayName, 'with data:', user);
      return (
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phone?.toLowerCase().includes(searchTerm) ||
        user.mobile?.toLowerCase().includes(searchTerm) ||
        user.displayName?.toLowerCase().includes(searchTerm)
      );
    });
    
    console.log('Filtered users:', filteredUsers.length);
    return filteredUsers;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

const searchTeams = async (searchTerm) => {
  try {
    console.log('Searching teams with query:', searchTerm);
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, limit(50));
    const snapshot = await getDocs(q);
    console.log('Total teams in collection:', snapshot.docs.length);
    
    const mappedTeams = snapshot.docs.map(doc => {
      const teamData = doc.data();
      console.log('Raw team data for', doc.id, ':', teamData);
      return {
        id: doc.id,
        ...teamData,
        type: 'team',
        displayName: teamData.name || teamData.teamName || 'Unknown Team',
        description: `${teamData.members?.length || 0} members`,
        icon: '👥'
      };
    });
    
    const filteredTeams = mappedTeams.filter(team => {
      console.log('Checking team:', team.displayName, 'with data:', team);
      return (
        team.name?.toLowerCase().includes(searchTerm) ||
        team.teamName?.toLowerCase().includes(searchTerm) ||
        team.description?.toLowerCase().includes(searchTerm) ||
        team.displayName?.toLowerCase().includes(searchTerm)
      );
    });
    
    console.log('Filtered teams:', filteredTeams.length);
    return filteredTeams;
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
};

const searchPetrolPumps = async (searchTerm) => {
  try {
    console.log('Searching petrol pumps with query:', searchTerm);
    const pumpsRef = collection(db, 'petrol_pumps');
    const q = query(pumpsRef, limit(50));
    const snapshot = await getDocs(q);
    console.log('Total petrol pumps in collection:', snapshot.docs.length);
    
    const mappedPumps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'petrol_pump',
      displayName: doc.data().name || 'Unknown Petrol Pump',
      description: `${doc.data().brand || 'Unknown Brand'} - ${doc.data().address || 'No address'}`,
      icon: '⛽'
    }));
    
    const filteredPumps = mappedPumps.filter(pump => 
      pump.name?.toLowerCase().includes(searchTerm) ||
      pump.brand?.toLowerCase().includes(searchTerm) ||
      pump.address?.toLowerCase().includes(searchTerm) ||
      pump.city?.toLowerCase().includes(searchTerm)
    );
    
    console.log('Filtered petrol pumps:', filteredPumps.length);
    return filteredPumps;
  } catch (error) {
    console.error('Error searching petrol pumps:', error);
    return [];
  }
};

const searchPetrolPumpRequests = async (searchTerm) => {
  try {
    console.log('Searching requests with query:', searchTerm);
    const requestsRef = collection(db, 'petrol_pump_requests');
    const q = query(requestsRef, limit(50));
    const snapshot = await getDocs(q);
    console.log('Total requests in collection:', snapshot.docs.length);
    
    const mappedRequests = snapshot.docs.map(doc => {
      const requestData = doc.data();
      console.log('Raw request data for', doc.id, ':', requestData);
      return {
        id: doc.id,
        ...requestData,
        type: 'request',
        displayName: `Request #${doc.id.slice(-6)}`,
        description: `${requestData.status || 'Unknown Status'} - ${requestData.petrolPumpName || 'Unknown Pump'}`,
        icon: '📋'
      };
    });
    
    const filteredRequests = mappedRequests.filter(request => {
      console.log('Checking request:', request.displayName, 'with data:', request);
      return (
        request.petrolPumpName?.toLowerCase().includes(searchTerm) ||
        request.status?.toLowerCase().includes(searchTerm) ||
        request.userName?.toLowerCase().includes(searchTerm) ||
        request.teamName?.toLowerCase().includes(searchTerm) ||
        request.user?.toLowerCase().includes(searchTerm) ||
        request.team?.toLowerCase().includes(searchTerm)
      );
    });
    
    console.log('Filtered requests:', filteredRequests.length);
    return filteredRequests;
  } catch (error) {
    console.error('Error searching petrol pump requests:', error);
    return [];
  }
};

const sortResultsByRelevance = (results, searchTerm) => {
  return results.sort((a, b) => {
    const aExactMatch = a.displayName?.toLowerCase() === searchTerm;
    const bExactMatch = b.displayName?.toLowerCase() === searchTerm;
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    const aStartsWith = a.displayName?.toLowerCase().startsWith(searchTerm);
    const bStartsWith = b.displayName?.toLowerCase().startsWith(searchTerm);
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    return 0;
  });
}; 