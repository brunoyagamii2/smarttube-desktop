CREATE TABLE `playlistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`videoId` int NOT NULL,
	`position` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playlistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`defaultPlaybackSpeed` float NOT NULL DEFAULT 1,
	`defaultQuality` varchar(20) DEFAULT 'auto',
	`autoplay` boolean NOT NULL DEFAULT true,
	`sponsorBlockEnabled` boolean NOT NULL DEFAULT true,
	`sponsorBlockCategories` json DEFAULT ('["sponsor","intro","outro","selfpromo"]'),
	`autoGenerateCaptions` boolean NOT NULL DEFAULT false,
	`theme` enum('light','dark','system') NOT NULL DEFAULT 'dark',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `videoTranscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`language` varchar(10) NOT NULL,
	`transcription` text NOT NULL,
	`generatedBy` varchar(50) NOT NULL DEFAULT 'whisper',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videoTranscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`duration` int NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`quality` varchar(20),
	`views` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoId` int NOT NULL,
	`currentTime` float NOT NULL,
	`duration` float NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`lastWatchedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchHistory_id` PRIMARY KEY(`id`)
);
