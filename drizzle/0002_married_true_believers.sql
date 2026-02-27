CREATE TABLE `autoplayQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`youtubeVideoId` varchar(20) NOT NULL,
	`title` varchar(500) NOT NULL,
	`channelName` varchar(255),
	`thumbnailUrl` text,
	`duration` int NOT NULL DEFAULT 0,
	`position` int NOT NULL,
	`source` enum('playlist','suggestions','related','subscriptions') NOT NULL,
	`sourceId` varchar(255),
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `autoplayQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtubeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`youtubeVideoId` varchar(20) NOT NULL,
	`title` varchar(500) NOT NULL,
	`channelName` varchar(255),
	`channelId` varchar(64),
	`thumbnailUrl` text,
	`duration` int NOT NULL DEFAULT 0,
	`currentTime` float NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`lastWatchedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtubeHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtubePlaylistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`youtubeVideoId` varchar(20) NOT NULL,
	`title` varchar(500) NOT NULL,
	`channelName` varchar(255),
	`channelId` varchar(64),
	`thumbnailUrl` text,
	`duration` int NOT NULL DEFAULT 0,
	`position` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `youtubePlaylistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `youtubeSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`channelId` varchar(64) NOT NULL,
	`channelName` varchar(255) NOT NULL,
	`channelThumbnail` text,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`lastVideoCheck` timestamp,
	CONSTRAINT `youtubeSubscriptions_id` PRIMARY KEY(`id`)
);
