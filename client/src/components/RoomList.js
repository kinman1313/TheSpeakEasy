import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Badge,
    Box
} from '@mui/material';
import { PersonOutline, Group } from '@mui/icons-material';

export default function RoomList({ rooms, activeRoom, onRoomSelect }) {
    return (
        <List>
            {rooms.map((room) => (
                <ListItem
                    key={room._id}
                    button
                    selected={activeRoom?._id === room._id}
                    onClick={() => onRoomSelect(room)}
                    sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                            backgroundColor: 'action.selected'
                        }
                    }}
                >
                    <ListItemAvatar>
                        <Avatar>
                            {room.type === 'direct' ? <PersonOutline /> : <Group />}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={
                            <Typography noWrap>
                                {room.name}
                            </Typography>
                        }
                        secondary={
                            room.lastMessage && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                >
                                    {room.lastMessage.content}
                                </Typography>
                            )
                        }
                    />
                    {room.unreadCount > 0 && (
                        <Box ml={1}>
                            <Badge
                                badgeContent={room.unreadCount}
                                color="primary"
                                max={99}
                            />
                        </Box>
                    )}
                </ListItem>
            ))}
        </List>
    );
} 