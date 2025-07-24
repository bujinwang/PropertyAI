import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Announcement as AnnouncementIcon,
  Forum as ForumIcon,
  RoomService as ServiceIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  expiresAt: string;
}

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  maxAttendees: number;
  currentAttendees: number;
  organizer: string;
  category: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  replies: number;
  createdAt: string;
  lastActivity: string;
}

interface ServiceRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  vendor: string;
  rating: number;
  price: string;
  contact: string;
}

interface AmenityReservation {
  id: string;
  amenityName: string;
  date: string;
  time: string;
  duration: number;
  reservedBy: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CommunityEngagementPortal: React.FC = () => {
  const [value, setValue] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [services, setServices] = useState<ServiceRecommendation[]>([]);
  const [reservations, setReservations] = useState<AmenityReservation[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showForumForm, setShowForumForm] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    expiresAt: '',
  });

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: 0,
    category: '',
  });

  const [newForumPost, setNewForumPost] = useState({
    title: '',
    content: '',
    category: '',
  });

  const [newReservation, setNewReservation] = useState({
    amenityName: '',
    date: '',
    time: '',
    duration: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [announcementsData, eventsData, forumData, servicesData, reservationsData] = await Promise.all([
        apiService.get('/api/community/announcements'),
        apiService.get('/api/community/events'),
        apiService.get('/api/community/forum'),
        apiService.get('/api/community/services'),
        apiService.get('/api/community/reservations'),
      ]);
      setAnnouncements(announcementsData.data);
      setEvents(eventsData.data);
      setForumPosts(forumData.data);
      setServices(servicesData.data);
      setReservations(reservationsData.data);
    } catch (error) {
      console.error('Error loading community data:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      await apiService.post('/api/community/announcements', newAnnouncement);
      setShowAnnouncementForm(false);
      setNewAnnouncement({ title: '', content: '', priority: 'medium', expiresAt: '' });
      loadData();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      await apiService.post('/api/community/events', newEvent);
      setShowEventForm(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxAttendees: 0,
        category: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleCreateForumPost = async () => {
    try {
      await apiService.post('/api/community/forum', newForumPost);
      setShowForumForm(false);
      setNewForumPost({ title: '', content: '', category: '' });
      loadData();
    } catch (error) {
      console.error('Error creating forum post:', error);
    }
  };

  const handleCreateReservation = async () => {
    try {
      await apiService.post('/api/community/reservations', newReservation);
      setShowReservationForm(false);
      setNewReservation({ amenityName: '', date: '', time: '', duration: 1 });
      loadData();
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Community Engagement Portal
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="community engagement portal tabs">
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnnouncementIcon />
                <Badge badgeContent={announcements.filter(a => a.priority === 'high').length} color="error">
                  Announcements
                </Badge>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon />
                Events
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ForumIcon />
                <Badge badgeContent={forumPosts.filter(p => p.replies === 0).length} color="info">
                  Forum
                </Badge>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ServiceIcon />
                Services
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon />
                Amenities
              </Box>
            } 
          />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Announcements</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAnnouncementForm(true)}
          >
            New Announcement
          </Button>
        </Box>

        <Grid container spacing={2}>
          {announcements.map((announcement) => (
            <Grid item xs={12} md={6} key={announcement.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" gutterBottom>
                      {announcement.title}
                    </Typography>
                    <Chip 
                      label={announcement.priority} 
                      color={getPriorityColor(announcement.priority) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {announcement.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    By {announcement.author} • {new Date(announcement.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Community Events</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowEventForm(true)}
          >
            Create Event
          </Button>
        </Box>

        <Grid container spacing={2}>
          {events.map((event) => (
            <Grid item xs={12} md={4} key={event.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {event.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EventIcon fontSize="small" />
                    <Typography variant="body2">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">{event.location}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body2">
                      {event.currentAttendees}/{event.maxAttendees} attending
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" variant="outlined">
                    RSVP
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Community Forum</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForumForm(true)}
          >
            New Post
          </Button>
        </Box>

        <List>
          {forumPosts.map((post) => (
            <ListItem key={post.id} divider>
              <ListItemAvatar>
                <Avatar>{post.author.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={post.title}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {post.content.substring(0, 100)}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {post.author} • {post.category} • {post.replies} replies
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={value} index={3}>
        <Typography variant="h5" gutterBottom>
          Service Recommendations
        </Typography>
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item xs={12} md={6} key={service.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {service.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {service.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={service.category} size="small" />
                    <Typography variant="h6" color="primary">
                      {service.price}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" variant="outlined">
                    Contact {service.vendor}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Amenity Reservations</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowReservationForm(true)}
          >
            Reserve Amenity
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amenity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Reserved By</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>{reservation.amenityName}</TableCell>
                  <TableCell>{new Date(reservation.date).toLocaleDateString()}</TableCell>
                  <TableCell>{reservation.time}</TableCell>
                  <TableCell>{reservation.duration} hour(s)</TableCell>
                  <TableCell>{reservation.reservedBy}</TableCell>
                  <TableCell>
                    <Chip 
                      label={reservation.status} 
                      color={getPriorityColor(reservation.status) as any}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Dialogs for creating new items */}
      <Dialog open={showAnnouncementForm} onClose={() => setShowAnnouncementForm(false)}>
        <DialogTitle>Create New Announcement</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Content"
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              fullWidth
              multiline
              rows={4}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newAnnouncement.priority}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Expires At"
              type="date"
              value={newAnnouncement.expiresAt}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnnouncementForm(false)}>Cancel</Button>
          <Button onClick={handleCreateAnnouncement} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showEventForm} onClose={() => setShowEventForm(false)}>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Date"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              fullWidth
            />
            <TextField
              label="Max Attendees"
              type="number"
              value={newEvent.maxAttendees}
              onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: Number(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Category"
              value={newEvent.category}
              onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventForm(false)}>Cancel</Button>
          <Button onClick={handleCreateEvent} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showForumForm} onClose={() => setShowForumForm(false)}>
        <DialogTitle>Create New Forum Post</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              value={newForumPost.title}
              onChange={(e) => setNewForumPost({ ...newForumPost, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Content"
              value={newForumPost.content}
              onChange={(e) => setNewForumPost({ ...newForumPost, content: e.target.value })}
              fullWidth
              multiline
              rows={4}
            />
            <TextField
              label="Category"
              value={newForumPost.category}
              onChange={(e) => setNewForumPost({ ...newForumPost, category: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForumForm(false)}>Cancel</Button>
          <Button onClick={handleCreateForumPost} variant="contained">Post</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showReservationForm} onClose={() => setShowReservationForm(false)}>
        <DialogTitle>Reserve Amenity</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Amenity Name"
              value={newReservation.amenityName}
              onChange={(e) => setNewReservation({ ...newReservation, amenityName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={newReservation.date}
              onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              value={newReservation.time}
              onChange={(e) => setNewReservation({ ...newReservation, time: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Duration (hours)"
              type="number"
              value={newReservation.duration}
              onChange={(e) => setNewReservation({ ...newReservation, duration: Number(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReservationForm(false)}>Cancel</Button>
          <Button onClick={handleCreateReservation} variant="contained">Reserve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityEngagementPortal;