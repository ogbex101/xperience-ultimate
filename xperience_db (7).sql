-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 13, 2026 at 10:31 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `xperience_db`
--

-- --------------------------------------------------------

--
-- Stand-in structure for view `active_tournament_matches`
-- (See below for the actual view)
--
CREATE TABLE `active_tournament_matches` (
`id` int(11) unsigned
,`tournament_id` int(11) unsigned
,`player1_id` int(10) unsigned
,`player2_id` int(10) unsigned
,`round_number` int(11)
,`match_time` datetime
,`completed_at` datetime
,`winner_id` int(11) unsigned
,`status` enum('upcoming','ongoing','completed')
,`created_at` timestamp
,`updated_at` timestamp
,`tournament_name` varchar(100)
,`tournament_type` enum('1v1','survival','freeforall','squad')
,`tournament_status` enum('upcoming','ongoing','completed','cancelled')
,`player1_username` varchar(50)
,`player1_avatar` varchar(255)
,`player2_username` varchar(50)
,`player2_avatar` varchar(255)
,`winner_username` varchar(50)
,`match_ready_status` varchar(9)
);

-- --------------------------------------------------------

--
-- Table structure for table `admin_activity_logs`
--

CREATE TABLE `admin_activity_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `affected_user_id` int(11) DEFAULT NULL,
  `affected_transaction_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_logs`
--

CREATE TABLE `admin_logs` (
  `id` int(11) UNSIGNED NOT NULL,
  `admin_id` int(11) UNSIGNED NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_messages`
--

CREATE TABLE `admin_messages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `message_type` enum('abandoned_tournament','stake_refund','general') DEFAULT 'general',
  `tournament_id` int(11) DEFAULT NULL,
  `stake_amount` decimal(10,2) DEFAULT 0.00,
  `requires_response` tinyint(1) DEFAULT 0,
  `user_response` enum('pending','yes','no') DEFAULT 'pending',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_monitoring_logs`
--

CREATE TABLE `admin_monitoring_logs` (
  `id` int(11) NOT NULL,
  `tournament_id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED DEFAULT NULL,
  `admin_id` int(10) UNSIGNED NOT NULL,
  `action_type` enum('joined_match','left_match','paused_match','resumed_match','warned_player','resolved_dispute','overrode_result','distributed_prize') NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','support') DEFAULT 'admin',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '["view_users", "view_transactions"]' CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bulk_action_queue`
--

CREATE TABLE `bulk_action_queue` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `target_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`target_ids`)),
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `success_count` int(11) DEFAULT 0,
  `failure_count` int(11) DEFAULT 0,
  `results` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`results`)),
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `message_type` enum('text','image','file') DEFAULT 'text',
  `status` enum('sent','delivered','read') DEFAULT 'sent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `currency_rates`
--

CREATE TABLE `currency_rates` (
  `id` int(11) NOT NULL,
  `base_currency` varchar(3) NOT NULL,
  `target_currency` varchar(3) NOT NULL,
  `exchange_rate` decimal(10,4) NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fraud_flags`
--

CREATE TABLE `fraud_flags` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `flag_type` enum('suspicious_transaction','multiple_accounts','chargeback_risk','kyc_mismatch') NOT NULL,
  `severity` enum('low','medium','high','critical') DEFAULT 'medium',
  `description` text NOT NULL,
  `evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence`)),
  `status` enum('active','investigating','resolved','false_positive') DEFAULT 'active',
  `assigned_admin_id` int(11) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

CREATE TABLE `friends` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `friend_id` int(11) UNSIGNED NOT NULL,
  `status` enum('pending','accepted','blocked') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `chat_enabled` tinyint(1) DEFAULT 1,
  `favorite` tinyint(1) DEFAULT 0,
  `friendship_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_favorite` tinyint(1) DEFAULT 0,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friend_activities`
--

CREATE TABLE `friend_activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `friend_id` int(11) NOT NULL,
  `activity_type` enum('match_played','tournament_joined','rank_up','achievement') DEFAULT NULL,
  `activity_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`activity_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friend_chat`
--

CREATE TABLE `friend_chat` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `game_specialty` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `max_members` int(11) DEFAULT 20,
  `visibility` enum('public','private') DEFAULT 'public'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_chat`
--

CREATE TABLE `group_chat` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_chat_visits`
--

CREATE TABLE `group_chat_visits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `last_visit` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `status` enum('joined','invited','requested') DEFAULT 'joined',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_tournaments`
--

CREATE TABLE `group_tournaments` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institutions`
--

CREATE TABLE `institutions` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `creator_id` int(11) NOT NULL,
  `type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `max_members` int(11) DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `institution_members`
--

CREATE TABLE `institution_members` (
  `id` int(11) NOT NULL,
  `institution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','member') DEFAULT 'member',
  `status` enum('joined','invited','requested') DEFAULT 'joined',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `matches`
--

CREATE TABLE `matches` (
  `id` int(11) UNSIGNED NOT NULL,
  `player1_id` int(11) UNSIGNED DEFAULT NULL,
  `player2_id` int(11) UNSIGNED DEFAULT NULL,
  `game_type` enum('individual','group','school','institution') NOT NULL,
  `game` varchar(50) DEFAULT NULL,
  `stake_amount` decimal(10,2) NOT NULL,
  `prize_pool_amount` decimal(10,2) DEFAULT 0.00,
  `custom_prize_pool` decimal(10,2) DEFAULT 0.00,
  `winner_id` int(11) UNSIGNED DEFAULT NULL,
  `status` enum('pending','ongoing','completed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `prize_pool_option` enum('entry_fee','custom') NOT NULL DEFAULT 'entry_fee',
  `opponent_type` enum('open','specific') DEFAULT 'open',
  `opponent_username` varchar(50) DEFAULT NULL,
  `stake_currency` varchar(10) DEFAULT 'money' COMMENT 'money or xp',
  `stake_currency_type` varchar(10) DEFAULT 'NGN' COMMENT 'NGN or XP',
  `stake_xp_amount` decimal(15,2) DEFAULT NULL COMMENT 'Amount in XP if stake_currency is xp',
  `admin_monitoring` tinyint(1) DEFAULT 0 COMMENT '1 = XP Admin monitoring enabled, 0 = disabled',
  `match_chat_enabled` tinyint(1) DEFAULT 1 COMMENT '1 = Chat enabled for this match'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `matches`
--
DELIMITER $$
CREATE TRIGGER `after_match_completion` AFTER UPDATE ON `matches` FOR EACH ROW BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update winner stats
        UPDATE users 
        SET wins = wins + 1, 
            matches_played = matches_played + 1,
            win_rate = ROUND((wins + 1) * 100.0 / (matches_played + 1), 2)
        WHERE id = NEW.winner_id;
        
        -- Update loser stats (determine loser)
        SET @loser_id = CASE 
            WHEN NEW.player1_id = NEW.winner_id THEN NEW.player2_id
            ELSE NEW.player1_id
        END;
        
        UPDATE users 
        SET losses = losses + 1, 
            matches_played = matches_played + 1,
            win_rate = ROUND(wins * 100.0 / (matches_played + 1), 2)
        WHERE id = @loser_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_match_insert_prize_pool` BEFORE INSERT ON `matches` FOR EACH ROW BEGIN
    -- Calculate prize pool based on option AND currency
    IF NEW.prize_pool_option = 'entry_fee' THEN
        IF NEW.stake_currency = 'money' THEN
            -- Money match: 85% of total stakes (15% platform fee)
            SET NEW.prize_pool_amount = NEW.stake_amount * 2 * 0.85;
        ELSE
            -- XP match: 100% of total stakes (NO platform fee)
            SET NEW.prize_pool_amount = NEW.stake_amount * 2;
        END IF;
    ELSEIF NEW.prize_pool_option = 'custom' THEN
        -- Custom prize: full custom amount (platform fee handled later)
        SET NEW.prize_pool_amount = NEW.custom_prize_pool;
    END IF;
    
    -- Validate custom prize pool
    IF NEW.prize_pool_option = 'custom' AND NEW.custom_prize_pool <= (NEW.stake_amount * 2) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Custom prize pool must be greater than entry fee × 2';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `match_attempts`
--

CREATE TABLE `match_attempts` (
  `id` int(11) NOT NULL,
  `player1_id` int(11) NOT NULL,
  `player2_id` int(11) NOT NULL,
  `player1_rank` varchar(3) NOT NULL DEFAULT 'E',
  `player2_rank` varchar(3) NOT NULL DEFAULT 'E',
  `match_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_chat`
--

CREATE TABLE `match_chat` (
  `id` int(11) UNSIGNED NOT NULL,
  `match_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_chat_messages`
--

CREATE TABLE `match_chat_messages` (
  `id` int(10) UNSIGNED NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_confirmations`
--

CREATE TABLE `match_confirmations` (
  `id` int(11) NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `status` enum('pending','confirmed','disputed') DEFAULT 'pending',
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_disputes`
--

CREATE TABLE `match_disputes` (
  `id` int(11) NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `disputing_user_id` int(10) UNSIGNED NOT NULL,
  `reason` text NOT NULL,
  `status` enum('open','in_review','resolved') DEFAULT 'open',
  `admin_id` int(10) UNSIGNED DEFAULT NULL,
  `resolution` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_history`
--

CREATE TABLE `match_history` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) DEFAULT NULL,
  `winner_id` int(11) NOT NULL,
  `loser_id` int(11) NOT NULL,
  `winner_score` int(11) NOT NULL,
  `loser_score` int(11) NOT NULL,
  `match_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_final` tinyint(1) DEFAULT 0,
  `round_number` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `match_prize_pool_details`
-- (See below for the actual view)
--
CREATE TABLE `match_prize_pool_details` (
`id` int(11) unsigned
,`player1_id` int(11) unsigned
,`player2_id` int(11) unsigned
,`game` varchar(50)
,`stake_amount` decimal(10,2)
,`prize_pool_option` enum('entry_fee','custom')
,`custom_prize_pool` decimal(10,2)
,`calculated_prize_pool` decimal(13,4)
,`platform_fee` decimal(13,4)
);

-- --------------------------------------------------------

--
-- Table structure for table `match_proofs`
--

CREATE TABLE `match_proofs` (
  `id` int(11) NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `proof_path` varchar(255) NOT NULL,
  `proof_type` enum('screenshot','video','other') DEFAULT 'screenshot',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_results`
--

CREATE TABLE `match_results` (
  `id` int(11) UNSIGNED NOT NULL,
  `match_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `winner_id` int(11) UNSIGNED NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `match_votes`
--

CREATE TABLE `match_votes` (
  `id` int(11) NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `voter_id` int(10) UNSIGNED NOT NULL,
  `vote` enum('confirm','dispute') NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) UNSIGNED NOT NULL,
  `sender_id` int(11) UNSIGNED NOT NULL,
  `receiver_id` int(11) UNSIGNED DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `message_type` enum('private','group') DEFAULT 'private',
  `read_status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `sender_id` int(11) UNSIGNED DEFAULT NULL,
  `message` text NOT NULL,
  `type` enum('invite','message','system','match','tournament','friend','transaction','group') DEFAULT NULL,
  `status` enum('unread','read','accepted','rejected') DEFAULT 'unread',
  `match_id` int(11) UNSIGNED DEFAULT NULL,
  `tournament_id` int(11) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `one_vs_one_match`
--

CREATE TABLE `one_vs_one_match` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `round_number` int(11) NOT NULL,
  `match_order` int(11) NOT NULL,
  `player1_id` int(11) DEFAULT NULL,
  `player2_id` int(11) DEFAULT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `player1_score` int(11) DEFAULT NULL,
  `player2_score` int(11) DEFAULT NULL,
  `match_time` datetime DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed') DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `one_vs_one_matches`
--

CREATE TABLE `one_vs_one_matches` (
  `id` int(11) UNSIGNED NOT NULL,
  `tournament_id` int(11) UNSIGNED NOT NULL,
  `round_number` int(11) NOT NULL,
  `match_order` int(11) NOT NULL COMMENT 'Order within the round',
  `player1_id` int(11) UNSIGNED NOT NULL,
  `player2_id` int(11) UNSIGNED NOT NULL,
  `winner_id` int(11) UNSIGNED DEFAULT NULL,
  `match_time` datetime NOT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  `player1_score` int(11) DEFAULT NULL,
  `player2_score` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `one_vs_one_tournament`
--

CREATE TABLE `one_vs_one_tournament` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `bracket_generated` tinyint(1) DEFAULT 0,
  `current_round` int(11) DEFAULT 1,
  `total_rounds` int(11) DEFAULT 1,
  `final_winner_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `one_vs_one_tournaments`
--

CREATE TABLE `one_vs_one_tournaments` (
  `id` int(11) UNSIGNED NOT NULL,
  `tournament_id` int(11) UNSIGNED NOT NULL,
  `bracket_generated` tinyint(1) DEFAULT 0,
  `current_round` int(11) DEFAULT 1,
  `total_rounds` int(11) DEFAULT 1,
  `bracket_structure` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bracket_structure`)),
  `auto_advance` tinyint(1) DEFAULT 1,
  `match_duration` int(11) DEFAULT 60 COMMENT 'Match duration in minutes',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rank_history`
--

CREATE TABLE `rank_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `old_rank` varchar(3) DEFAULT NULL,
  `new_rank` varchar(3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rank_requirements`
--

CREATE TABLE `rank_requirements` (
  `id` int(11) NOT NULL,
  `rank` varchar(10) NOT NULL,
  `name` varchar(50) NOT NULL,
  `min_wins` int(11) NOT NULL,
  `min_matches` int(11) NOT NULL,
  `win_rate` decimal(5,2) NOT NULL,
  `min_staked_wins` int(11) DEFAULT 0,
  `min_stake_amount` decimal(10,2) DEFAULT 0.00,
  `min_higher_rank_defeats` int(11) DEFAULT 0,
  `min_tournament_wins` int(11) DEFAULT 0,
  `min_freeforall_wins` int(11) DEFAULT 0,
  `min_squad_wins` int(11) DEFAULT 0,
  `min_onevsone_wins` int(11) DEFAULT 0,
  `target_rank` varchar(10) DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL,
  `glow` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipt_templates`
--

CREATE TABLE `receipt_templates` (
  `id` int(11) NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `template_html` text NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`variables`)),
  `is_default` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `revenue`
--

CREATE TABLE `revenue` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `revenue_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_tasks`
--

CREATE TABLE `scheduled_tasks` (
  `id` int(11) UNSIGNED NOT NULL,
  `task_type` varchar(50) NOT NULL,
  `related_id` int(11) UNSIGNED DEFAULT NULL,
  `execute_at` datetime NOT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `attempts` int(11) DEFAULT 0,
  `last_attempt_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `squad_tournament_prize_pool_details`
-- (See below for the actual view)
--
CREATE TABLE `squad_tournament_prize_pool_details` (
);

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `data_type` enum('string','number','boolean','json','array') DEFAULT 'string',
  `category` varchar(50) DEFAULT 'general',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `titles`
--

CREATE TABLE `titles` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `tier` enum('sacred','disputable','class') NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#FFFFFF',
  `icon` varchar(100) DEFAULT NULL,
  `requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requirements`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `title_awards`
--

CREATE TABLE `title_awards` (
  `id` int(10) UNSIGNED NOT NULL,
  `tournament_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `title_type` enum('boundless','chaos','order') NOT NULL,
  `awarded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournaments`
--

CREATE TABLE `tournaments` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `game` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `creator_id` int(11) UNSIGNED NOT NULL,
  `group_id` int(11) DEFAULT NULL,
  `max_players` int(11) NOT NULL,
  `max_groups` int(11) DEFAULT NULL,
  `min_players` int(11) NOT NULL DEFAULT 2,
  `xp_entry_fee` decimal(10,2) DEFAULT 0.00,
  `team_based` tinyint(1) NOT NULL DEFAULT 0,
  `prize_pool` decimal(10,2) DEFAULT 0.00,
  `custom_prize_pool` decimal(10,2) DEFAULT 0.00,
  `platform_fee` decimal(10,2) DEFAULT 0.00,
  `start_date` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  `winner_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `type` enum('1v1','survival','freeforall','squad') NOT NULL DEFAULT '1v1',
  `admin_pin` varchar(4) DEFAULT NULL,
  `live_stream_url` varchar(500) DEFAULT NULL,
  `prize_pool_option` enum('entry_fee','custom') NOT NULL DEFAULT 'entry_fee',
  `title_requirements_boundless` text DEFAULT NULL,
  `title_requirements_chaos` text DEFAULT NULL,
  `title_requirements_order` text DEFAULT NULL,
  `additional_awards` text DEFAULT NULL,
  `title_boundless_winner` int(10) UNSIGNED DEFAULT NULL,
  `title_chaos_winner` int(10) UNSIGNED DEFAULT NULL,
  `title_order_winner` int(10) UNSIGNED DEFAULT NULL,
  `currency` enum('xp','money') NOT NULL DEFAULT 'xp',
  `max_squads` int(11) DEFAULT 8,
  `max_players_per_squad` int(11) DEFAULT 5,
  `squad_name` varchar(100) DEFAULT NULL,
  `admin_monitoring` tinyint(1) DEFAULT 0,
  `dispute_resolution` enum('auto','admin','voting') DEFAULT 'auto'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_admins`
--

CREATE TABLE `tournament_admins` (
  `id` int(11) NOT NULL,
  `tournament_id` int(10) UNSIGNED NOT NULL,
  `admin_id` int(10) UNSIGNED NOT NULL,
  `role` enum('monitor','moderator','full_access') DEFAULT 'monitor',
  `added_by` int(10) UNSIGNED NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_bets`
--

CREATE TABLE `tournament_bets` (
  `id` int(11) UNSIGNED NOT NULL,
  `tournament_id` int(11) UNSIGNED NOT NULL,
  `match_id` int(11) UNSIGNED DEFAULT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `predicted_winner_id` int(11) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `odds` decimal(5,2) NOT NULL,
  `potential_payout` decimal(10,2) NOT NULL,
  `status` enum('pending','won','lost','refunded') DEFAULT 'pending',
  `bet_type` varchar(50) DEFAULT 'tournament',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_chat`
--

CREATE TABLE `tournament_chat` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_invites`
--

CREATE TABLE `tournament_invites` (
  `id` int(10) UNSIGNED NOT NULL,
  `tournament_id` int(10) UNSIGNED NOT NULL,
  `invite_code` varchar(100) NOT NULL,
  `created_by` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `max_uses` int(11) DEFAULT NULL,
  `use_count` int(11) DEFAULT 0,
  `last_used_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_matches`
--

CREATE TABLE `tournament_matches` (
  `id` int(11) UNSIGNED NOT NULL,
  `tournament_id` int(11) UNSIGNED NOT NULL,
  `player1_id` int(10) UNSIGNED DEFAULT NULL,
  `player2_id` int(10) UNSIGNED DEFAULT NULL,
  `round_number` int(11) NOT NULL,
  `match_time` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `winner_id` int(11) UNSIGNED DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed') DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_match_claims`
--

CREATE TABLE `tournament_match_claims` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `player1_claim` int(11) DEFAULT NULL,
  `player2_claim` int(11) DEFAULT NULL,
  `agreed_winner_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_participants`
--

CREATE TABLE `tournament_participants` (
  `id` int(11) UNSIGNED NOT NULL,
  `tournament_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `group_id` int(11) DEFAULT NULL,
  `status` enum('invited','joined','declined') DEFAULT 'invited',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `kills` int(11) DEFAULT 0,
  `squad_name` varchar(50) DEFAULT NULL,
  `squad_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tournament_prize_pools`
--

CREATE TABLE `tournament_prize_pools` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `prize_pool_option` enum('entry_fee','custom') DEFAULT 'entry_fee',
  `custom_prize_pool` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `tournament_prize_pool_details`
-- (See below for the actual view)
--
CREATE TABLE `tournament_prize_pool_details` (
);

-- --------------------------------------------------------

--
-- Table structure for table `tournament_proofs`
--

CREATE TABLE `tournament_proofs` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `tournament_standings`
-- (See below for the actual view)
--
CREATE TABLE `tournament_standings` (
`tournament_id` int(11) unsigned
,`user_id` int(11) unsigned
,`username` varchar(50)
,`rank` varchar(3)
,`profile_pic` varchar(255)
,`matches_played` bigint(21)
,`wins` decimal(22,0)
,`losses` decimal(22,0)
,`win_rate` decimal(28,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `tournament_teams`
--

CREATE TABLE `tournament_teams` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `team_member_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'NGN',
  `type` enum('deposit','withdrawal','tournament_entry','winning','refund') NOT NULL,
  `status` enum('pending','completed','failed','pending_approval','approved') DEFAULT 'pending',
  `reference` varchar(100) NOT NULL,
  `external_reference` varchar(255) DEFAULT NULL,
  `withdrawal_details` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `payment_gateway` varchar(50) DEFAULT NULL,
  `gateway_reference` varchar(100) DEFAULT NULL,
  `account_details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trust_score_history`
--

CREATE TABLE `trust_score_history` (
  `id` int(11) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `change_amount` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `related_match_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `firstname` varchar(100) DEFAULT NULL,
  `lastname` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `profile_pic` varchar(255) DEFAULT 'default.png',
  `rank` varchar(3) DEFAULT 'E',
  `matches_played` int(11) DEFAULT 0,
  `tournaments_played` int(11) DEFAULT 0,
  `tournaments_won` int(11) DEFAULT 0,
  `wins` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0,
  `balance` decimal(10,2) DEFAULT 0.00,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `admin_approved` int(11) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `win_rate` decimal(5,2) DEFAULT 0.00,
  `admin_role` varchar(50) DEFAULT NULL,
  `last_admin_login` timestamp NULL DEFAULT NULL,
  `is_banned` tinyint(1) DEFAULT 0,
  `enable_2fa` tinyint(4) DEFAULT 0,
  `login_alerts` tinyint(4) DEFAULT 1,
  `session_timeout` int(11) DEFAULT 60,
  `wallet_account_number` varchar(20) DEFAULT NULL,
  `transaction_pin` varchar(255) DEFAULT NULL,
  `pin_set_at` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(64) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL,
  `favorite_games` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `account_status` enum('active','inactive','suspended') DEFAULT 'active',
  `xp_points` int(11) DEFAULT 0,
  `admin_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`admin_permissions`)),
  `last_seen` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_bank_accounts`
--

CREATE TABLE `user_bank_accounts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_number` varchar(20) NOT NULL,
  `bank_code` varchar(10) NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `account_name` varchar(100) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_bank_details`
--

CREATE TABLE `user_bank_details` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bank_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`bank_details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_stats`
--

CREATE TABLE `user_stats` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `tournaments_played` int(11) DEFAULT 0,
  `tournaments_won` int(11) DEFAULT 0,
  `win_rate` decimal(5,2) DEFAULT 0.00,
  `highest_rank` int(11) DEFAULT NULL,
  `current_streak` int(11) DEFAULT 0,
  `longest_streak` int(11) DEFAULT 0,
  `total_kills` int(11) DEFAULT 0,
  `total_deaths` int(11) DEFAULT 0,
  `kd_ratio` decimal(5,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `comeback_wins` int(11) DEFAULT 0,
  `perfect_wins` int(11) DEFAULT 0,
  `undefeated_seasons` int(11) DEFAULT 0,
  `days_at_rank1` int(11) DEFAULT 0,
  `female_only_tournaments` int(11) DEFAULT 0,
  `squad_tournaments_won` int(11) DEFAULT 0,
  `mvp_awards` int(11) DEFAULT 0,
  `prediction_accuracy` decimal(5,2) DEFAULT 0.00,
  `strategic_wins` int(11) DEFAULT 0,
  `peak_rating` int(11) DEFAULT 0,
  `arena_wins` int(11) DEFAULT 0,
  `defensive_wins` int(11) DEFAULT 0,
  `elimination_ratio` decimal(5,2) DEFAULT 0.00,
  `first_bloods` int(11) DEFAULT 0,
  `stealth_kills` int(11) DEFAULT 0,
  `survival_rate` decimal(5,2) DEFAULT 0.00,
  `damage_taken_ratio` decimal(5,2) DEFAULT 0.00,
  `undefeated_rounds` int(11) DEFAULT 0,
  `technical_mastery` decimal(5,2) DEFAULT 0.00,
  `unconventional_wins` int(11) DEFAULT 0,
  `creative_plays` int(11) DEFAULT 0,
  `strategy_rating` decimal(5,2) DEFAULT 0.00,
  `game_changing_plays` int(11) DEFAULT 0,
  `solo_wins` int(11) DEFAULT 0,
  `adventure_wins` int(11) DEFAULT 0,
  `exploration_rate` decimal(5,2) DEFAULT 0.00,
  `skill_mastery` decimal(5,2) DEFAULT 0.00,
  `headshot_ratio` decimal(5,2) DEFAULT 0.00,
  `justice_wins` int(11) DEFAULT 0,
  `different_games_played` int(11) DEFAULT 0,
  `crafting_mastery` decimal(5,2) DEFAULT 0.00,
  `unique_creations` int(11) DEFAULT 0,
  `mentorship_score` decimal(5,2) DEFAULT 0.00,
  `recon_success_rate` decimal(5,2) DEFAULT 0.00,
  `aggressive_wins` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_status`
--

CREATE TABLE `user_status` (
  `user_id` int(11) NOT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  `last_seen` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_message` varchar(255) DEFAULT NULL,
  `current_game` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_titles`
--

CREATE TABLE `user_titles` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `title_id` int(11) UNSIGNED NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_equipped` tinyint(1) DEFAULT 0,
  `tournament_id` int(11) UNSIGNED DEFAULT NULL,
  `achievement_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`achievement_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_wallets`
--

CREATE TABLE `user_wallets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'NGN',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `verification_timers`
--

CREATE TABLE `verification_timers` (
  `id` int(11) NOT NULL,
  `match_id` int(10) UNSIGNED NOT NULL,
  `timer_type` enum('confirmation','voting') NOT NULL,
  `expires_at` datetime NOT NULL,
  `status` enum('active','expired','completed') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `withdrawal_approvals`
--

CREATE TABLE `withdrawal_approvals` (
  `id` int(11) NOT NULL,
  `withdrawal_request_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `old_status` varchar(50) NOT NULL,
  `new_status` enum('pending','approved','rejected','processing','completed') NOT NULL,
  `notes` text DEFAULT NULL,
  `proof_document` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `withdrawal_requests`
--

CREATE TABLE `withdrawal_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'NGN',
  `bank_name` varchar(100) NOT NULL,
  `bank_code` varchar(10) NOT NULL,
  `account_number` varchar(20) NOT NULL,
  `account_name` varchar(100) NOT NULL,
  `status` enum('pending','approved','processing','completed','rejected','failed') DEFAULT 'pending',
  `receipt_number` varchar(50) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `xp_rates`
--

CREATE TABLE `xp_rates` (
  `id` int(11) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'NGN',
  `xp_per_unit` decimal(10,2) NOT NULL DEFAULT 25.00,
  `unit_amount` decimal(10,2) NOT NULL DEFAULT 1000.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `description` varchar(255) DEFAULT 'XP conversion rate'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `xp_transactions`
--

CREATE TABLE `xp_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tournament_id` int(11) DEFAULT NULL,
  `type` enum('earned','spent','transferred_in','transferred_out','converted_from_money','converted_to_money') NOT NULL,
  `amount` int(11) NOT NULL,
  `related_transaction_id` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `match_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `active_tournament_matches`
--
DROP TABLE IF EXISTS `active_tournament_matches`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_tournament_matches`  AS SELECT `tm`.`id` AS `id`, `tm`.`tournament_id` AS `tournament_id`, `tm`.`player1_id` AS `player1_id`, `tm`.`player2_id` AS `player2_id`, `tm`.`round_number` AS `round_number`, `tm`.`match_time` AS `match_time`, `tm`.`completed_at` AS `completed_at`, `tm`.`winner_id` AS `winner_id`, `tm`.`status` AS `status`, `tm`.`created_at` AS `created_at`, `tm`.`updated_at` AS `updated_at`, `t`.`name` AS `tournament_name`, `t`.`type` AS `tournament_type`, `t`.`status` AS `tournament_status`, `p1`.`username` AS `player1_username`, `p1`.`profile_pic` AS `player1_avatar`, `p2`.`username` AS `player2_username`, `p2`.`profile_pic` AS `player2_avatar`, `w`.`username` AS `winner_username`, CASE WHEN `tm`.`status` = 'completed' THEN 'completed' WHEN `tm`.`player1_id` is null OR `tm`.`player2_id` is null THEN 'waiting' ELSE 'ready' END AS `match_ready_status` FROM ((((`tournament_matches` `tm` join `tournaments` `t` on(`tm`.`tournament_id` = `t`.`id`)) left join `users` `p1` on(`tm`.`player1_id` = `p1`.`id`)) left join `users` `p2` on(`tm`.`player2_id` = `p2`.`id`)) left join `users` `w` on(`tm`.`winner_id` = `w`.`id`)) WHERE `t`.`status` = 'ongoing' ;

-- --------------------------------------------------------

--
-- Structure for view `match_prize_pool_details`
--
DROP TABLE IF EXISTS `match_prize_pool_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `match_prize_pool_details`  AS SELECT `m`.`id` AS `id`, `m`.`player1_id` AS `player1_id`, `m`.`player2_id` AS `player2_id`, `m`.`game` AS `game`, `m`.`stake_amount` AS `stake_amount`, `m`.`prize_pool_option` AS `prize_pool_option`, `m`.`custom_prize_pool` AS `custom_prize_pool`, CASE WHEN `m`.`prize_pool_option` = 'entry_fee' THEN `m`.`stake_amount`* 0.85 WHEN `m`.`prize_pool_option` = 'custom' THEN `m`.`custom_prize_pool`* 0.85 ELSE 0 END AS `calculated_prize_pool`, CASE WHEN `m`.`prize_pool_option` = 'entry_fee' THEN `m`.`stake_amount`* 0.15 WHEN `m`.`prize_pool_option` = 'custom' THEN `m`.`custom_prize_pool`* 0.15 ELSE 0 END AS `platform_fee` FROM `matches` AS `m` ;

-- --------------------------------------------------------

--
-- Structure for view `squad_tournament_prize_pool_details`
--
DROP TABLE IF EXISTS `squad_tournament_prize_pool_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `squad_tournament_prize_pool_details`  AS SELECT `t`.`id` AS `id`, `t`.`name` AS `name`, `t`.`game` AS `game`, `t`.`entry_fee` AS `entry_fee`, `t`.`max_groups` AS `max_groups`, `t`.`prize_pool_option` AS `prize_pool_option`, `t`.`custom_prize_pool` AS `custom_prize_pool`, CASE WHEN `t`.`prize_pool_option` = 'entry_fee' THEN `t`.`entry_fee`* `t`.`max_groups` * 0.85 WHEN `t`.`prize_pool_option` = 'custom' THEN `t`.`custom_prize_pool`* 0.85 ELSE 0 END AS `calculated_prize_pool`, CASE WHEN `t`.`prize_pool_option` = 'entry_fee' THEN `t`.`entry_fee`* `t`.`max_groups` * 0.15 WHEN `t`.`prize_pool_option` = 'custom' THEN `t`.`custom_prize_pool`* 0.15 ELSE 0 END AS `platform_fee`, (select count(distinct `tp`.`group_id`) from `tournament_participants` `tp` where `tp`.`tournament_id` = `t`.`id` and `tp`.`status` = 'joined') AS `current_groups` FROM `tournaments` AS `t` WHERE `t`.`type` = 'squad' ;

-- --------------------------------------------------------

--
-- Structure for view `tournament_prize_pool_details`
--
DROP TABLE IF EXISTS `tournament_prize_pool_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `tournament_prize_pool_details`  AS SELECT `t`.`id` AS `id`, `t`.`name` AS `name`, `t`.`game` AS `game`, `t`.`type` AS `type`, `t`.`entry_fee` AS `entry_fee`, `t`.`max_players` AS `max_players`, `t`.`prize_pool_option` AS `prize_pool_option`, `t`.`custom_prize_pool` AS `custom_prize_pool`, CASE WHEN `t`.`prize_pool_option` = 'entry_fee' THEN `t`.`entry_fee`* `t`.`max_players` * 0.85 WHEN `t`.`prize_pool_option` = 'custom' THEN `t`.`custom_prize_pool`* 0.85 ELSE 0 END AS `calculated_prize_pool`, CASE WHEN `t`.`prize_pool_option` = 'entry_fee' THEN `t`.`entry_fee`* `t`.`max_players` * 0.15 WHEN `t`.`prize_pool_option` = 'custom' THEN `t`.`custom_prize_pool`* 0.15 ELSE 0 END AS `platform_fee`, (select count(0) from `tournament_participants` `tp` where `tp`.`tournament_id` = `t`.`id` and `tp`.`status` = 'joined') AS `current_participants` FROM `tournaments` AS `t` ;

-- --------------------------------------------------------

--
-- Structure for view `tournament_standings`
--
DROP TABLE IF EXISTS `tournament_standings`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `tournament_standings`  AS SELECT `tp`.`tournament_id` AS `tournament_id`, `u`.`id` AS `user_id`, `u`.`username` AS `username`, `u`.`rank` AS `rank`, `u`.`profile_pic` AS `profile_pic`, count(distinct `tm`.`id`) AS `matches_played`, sum(case when `tm`.`winner_id` = `u`.`id` then 1 else 0 end) AS `wins`, sum(case when `tm`.`winner_id` <> `u`.`id` and `tm`.`winner_id` is not null then 1 else 0 end) AS `losses`, round(sum(case when `tm`.`winner_id` = `u`.`id` then 1 else 0 end) * 100.0 / nullif(count(distinct `tm`.`id`),0),2) AS `win_rate` FROM ((`tournament_participants` `tp` join `users` `u` on(`tp`.`user_id` = `u`.`id`)) left join `tournament_matches` `tm` on((`tm`.`player1_id` = `u`.`id` or `tm`.`player2_id` = `u`.`id`) and `tm`.`tournament_id` = `tp`.`tournament_id` and `tm`.`status` = 'completed')) WHERE `tp`.`status` = 'joined' GROUP BY `tp`.`tournament_id`, `u`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_created` (`admin_id`,`created_at`);

--
-- Indexes for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `action_index` (`action`),
  ADD KEY `created_at_index` (`created_at`);

--
-- Indexes for table `admin_messages`
--
ALTER TABLE `admin_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `admin_monitoring_logs`
--
ALTER TABLE `admin_monitoring_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `bulk_action_queue`
--
ALTER TABLE `bulk_action_queue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chat_sender` (`sender_id`),
  ADD KEY `idx_chat_receiver` (`receiver_id`,`created_at`),
  ADD KEY `idx_chat_group` (`group_id`,`created_at`);

--
-- Indexes for table `currency_rates`
--
ALTER TABLE `currency_rates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fraud_flags`
--
ALTER TABLE `fraud_flags`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_status` (`user_id`,`status`),
  ADD KEY `idx_severity` (`severity`);

--
-- Indexes for table `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_friendship` (`user_id`,`friend_id`),
  ADD KEY `friend_id` (`friend_id`);

--
-- Indexes for table `friend_activities`
--
ALTER TABLE `friend_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_friend_activities` (`user_id`,`friend_id`,`created_at`);

--
-- Indexes for table `friend_chat`
--
ALTER TABLE `friend_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `group_chat`
--
ALTER TABLE `group_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `group_chat_visits`
--
ALTER TABLE `group_chat_visits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_group` (`user_id`,`group_id`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `group_id` (`group_id`,`user_id`);

--
-- Indexes for table `group_tournaments`
--
ALTER TABLE `group_tournaments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_tournament` (`tournament_id`,`group_id`);

--
-- Indexes for table `institutions`
--
ALTER TABLE `institutions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `institution_members`
--
ALTER TABLE `institution_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `institution_id` (`institution_id`,`user_id`);

--
-- Indexes for table `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `player1_id` (`player1_id`),
  ADD KEY `player2_id` (`player2_id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_matches_players` (`player1_id`,`player2_id`),
  ADD KEY `idx_matches_status` (`status`),
  ADD KEY `idx_prize_pool_option` (`prize_pool_option`);

--
-- Indexes for table `match_attempts`
--
ALTER TABLE `match_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_match_attempts_players` (`player1_id`,`player2_id`),
  ADD KEY `idx_match_attempts_rank` (`player1_rank`,`player2_rank`),
  ADD KEY `idx_match_attempts_date` (`created_at`);

--
-- Indexes for table `match_chat`
--
ALTER TABLE `match_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `match_chat_messages`
--
ALTER TABLE `match_chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_match_id` (`match_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `match_confirmations`
--
ALTER TABLE `match_confirmations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_match_user` (`match_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `match_disputes`
--
ALTER TABLE `match_disputes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `disputing_user_id` (`disputing_user_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `idx_match_disputes_status` (`status`);

--
-- Indexes for table `match_history`
--
ALTER TABLE `match_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `match_proofs`
--
ALTER TABLE `match_proofs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `match_results`
--
ALTER TABLE `match_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_match_user` (`match_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `winner_id` (`winner_id`);

--
-- Indexes for table `match_votes`
--
ALTER TABLE `match_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_match_voter` (`match_id`,`voter_id`),
  ADD KEY `voter_id` (`voter_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`),
  ADD KEY `group_id` (`group_id`),
  ADD KEY `idx_messages_conversation` (`sender_id`,`receiver_id`,`created_at`),
  ADD KEY `idx_messages_group` (`group_id`,`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `tournament_id` (`tournament_id`);

--
-- Indexes for table `one_vs_one_match`
--
ALTER TABLE `one_vs_one_match`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tournament` (`tournament_id`),
  ADD KEY `idx_round` (`tournament_id`,`round_number`);

--
-- Indexes for table `one_vs_one_matches`
--
ALTER TABLE `one_vs_one_matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `round_number` (`round_number`),
  ADD KEY `player1_id` (`player1_id`),
  ADD KEY `player2_id` (`player2_id`),
  ADD KEY `winner_id` (`winner_id`);

--
-- Indexes for table `one_vs_one_tournament`
--
ALTER TABLE `one_vs_one_tournament`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tournament` (`tournament_id`),
  ADD KEY `idx_final_winner` (`final_winner_id`);

--
-- Indexes for table `one_vs_one_tournaments`
--
ALTER TABLE `one_vs_one_tournaments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tournament_id` (`tournament_id`);

--
-- Indexes for table `rank_history`
--
ALTER TABLE `rank_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `rank_requirements`
--
ALTER TABLE `rank_requirements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rank` (`rank`);

--
-- Indexes for table `receipt_templates`
--
ALTER TABLE `receipt_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `revenue`
--
ALTER TABLE `revenue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `task_type` (`task_type`,`status`,`execute_at`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `titles`
--
ALTER TABLE `titles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_name` (`name`);

--
-- Indexes for table `title_awards`
--
ALTER TABLE `title_awards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `idx_user_titles` (`user_id`,`title_type`);

--
-- Indexes for table `tournaments`
--
ALTER TABLE `tournaments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `creator_id` (`creator_id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_prize_pool_option` (`prize_pool_option`),
  ADD KEY `title_boundless_winner` (`title_boundless_winner`),
  ADD KEY `title_chaos_winner` (`title_chaos_winner`),
  ADD KEY `title_order_winner` (`title_order_winner`);

--
-- Indexes for table `tournament_admins`
--
ALTER TABLE `tournament_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tournament_admin` (`tournament_id`,`admin_id`),
  ADD KEY `admin_id` (`admin_id`),
  ADD KEY `added_by` (`added_by`);

--
-- Indexes for table `tournament_bets`
--
ALTER TABLE `tournament_bets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `predicted_winner_id` (`predicted_winner_id`);

--
-- Indexes for table `tournament_chat`
--
ALTER TABLE `tournament_chat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tournament_invites`
--
ALTER TABLE `tournament_invites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `tournament_matches`
--
ALTER TABLE `tournament_matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `player1_id` (`player1_id`),
  ADD KEY `player2_id` (`player2_id`),
  ADD KEY `winner_id` (`winner_id`),
  ADD KEY `idx_tournament_matches_tournament` (`tournament_id`),
  ADD KEY `idx_tournament_matches_round` (`round_number`),
  ADD KEY `idx_tournament_matches_players` (`player1_id`,`player2_id`),
  ADD KEY `idx_tournament_matches_status` (`status`);

--
-- Indexes for table `tournament_match_claims`
--
ALTER TABLE `tournament_match_claims`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_match` (`match_id`);

--
-- Indexes for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tournament_id` (`tournament_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_tournament_participants_tournament` (`tournament_id`,`status`);

--
-- Indexes for table `tournament_prize_pools`
--
ALTER TABLE `tournament_prize_pools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tournament` (`tournament_id`);

--
-- Indexes for table `tournament_proofs`
--
ALTER TABLE `tournament_proofs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tournament_teams`
--
ALTER TABLE `tournament_teams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team` (`tournament_id`,`user_id`,`team_member_id`),
  ADD KEY `tournament_id` (`tournament_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `team_member_id` (`team_member_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reference` (`reference`);

--
-- Indexes for table `trust_score_history`
--
ALTER TABLE `trust_score_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `related_match_id` (`related_match_id`),
  ADD KEY `idx_trust_score_history_user` (`user_id`,`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `wallet_account_number` (`wallet_account_number`),
  ADD KEY `idx_users_id_username` (`id`,`username`);

--
-- Indexes for table `user_bank_accounts`
--
ALTER TABLE `user_bank_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_bank_details`
--
ALTER TABLE `user_bank_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_bank` (`user_id`);

--
-- Indexes for table `user_stats`
--
ALTER TABLE `user_stats`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_status`
--
ALTER TABLE `user_status`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_online_status` (`is_online`,`last_seen`);

--
-- Indexes for table `user_titles`
--
ALTER TABLE `user_titles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_title` (`user_id`,`title_id`),
  ADD KEY `title_id` (`title_id`),
  ADD KEY `tournament_id` (`tournament_id`);

--
-- Indexes for table `user_wallets`
--
ALTER TABLE `user_wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `verification_timers`
--
ALTER TABLE `verification_timers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `match_id` (`match_id`),
  ADD KEY `idx_verification_timers_expires` (`expires_at`,`status`);

--
-- Indexes for table `withdrawal_approvals`
--
ALTER TABLE `withdrawal_approvals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `xp_rates`
--
ALTER TABLE `xp_rates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `xp_transactions`
--
ALTER TABLE `xp_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_messages`
--
ALTER TABLE `admin_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_monitoring_logs`
--
ALTER TABLE `admin_monitoring_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bulk_action_queue`
--
ALTER TABLE `bulk_action_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `currency_rates`
--
ALTER TABLE `currency_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fraud_flags`
--
ALTER TABLE `fraud_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friends`
--
ALTER TABLE `friends`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friend_activities`
--
ALTER TABLE `friend_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friend_chat`
--
ALTER TABLE `friend_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_chat`
--
ALTER TABLE `group_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_chat_visits`
--
ALTER TABLE `group_chat_visits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_tournaments`
--
ALTER TABLE `group_tournaments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `institutions`
--
ALTER TABLE `institutions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `institution_members`
--
ALTER TABLE `institution_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `matches`
--
ALTER TABLE `matches`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_attempts`
--
ALTER TABLE `match_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_chat`
--
ALTER TABLE `match_chat`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_chat_messages`
--
ALTER TABLE `match_chat_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_confirmations`
--
ALTER TABLE `match_confirmations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_disputes`
--
ALTER TABLE `match_disputes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_history`
--
ALTER TABLE `match_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_proofs`
--
ALTER TABLE `match_proofs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_results`
--
ALTER TABLE `match_results`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_votes`
--
ALTER TABLE `match_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `one_vs_one_match`
--
ALTER TABLE `one_vs_one_match`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `one_vs_one_matches`
--
ALTER TABLE `one_vs_one_matches`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `one_vs_one_tournament`
--
ALTER TABLE `one_vs_one_tournament`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `one_vs_one_tournaments`
--
ALTER TABLE `one_vs_one_tournaments`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rank_history`
--
ALTER TABLE `rank_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rank_requirements`
--
ALTER TABLE `rank_requirements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `receipt_templates`
--
ALTER TABLE `receipt_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `revenue`
--
ALTER TABLE `revenue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `titles`
--
ALTER TABLE `titles`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `title_awards`
--
ALTER TABLE `title_awards`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournaments`
--
ALTER TABLE `tournaments`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_admins`
--
ALTER TABLE `tournament_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_bets`
--
ALTER TABLE `tournament_bets`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_chat`
--
ALTER TABLE `tournament_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_invites`
--
ALTER TABLE `tournament_invites`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_matches`
--
ALTER TABLE `tournament_matches`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_match_claims`
--
ALTER TABLE `tournament_match_claims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_prize_pools`
--
ALTER TABLE `tournament_prize_pools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_proofs`
--
ALTER TABLE `tournament_proofs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_teams`
--
ALTER TABLE `tournament_teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trust_score_history`
--
ALTER TABLE `trust_score_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_bank_accounts`
--
ALTER TABLE `user_bank_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_bank_details`
--
ALTER TABLE `user_bank_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_titles`
--
ALTER TABLE `user_titles`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_wallets`
--
ALTER TABLE `user_wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `verification_timers`
--
ALTER TABLE `verification_timers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdrawal_approvals`
--
ALTER TABLE `withdrawal_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdrawal_requests`
--
ALTER TABLE `withdrawal_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `xp_rates`
--
ALTER TABLE `xp_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `xp_transactions`
--
ALTER TABLE `xp_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `admin_monitoring_logs`
--
ALTER TABLE `admin_monitoring_logs`
  ADD CONSTRAINT `admin_monitoring_logs_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_monitoring_logs_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_monitoring_logs_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `group_members`
--
ALTER TABLE `group_members`
  ADD CONSTRAINT `fk_group_capacity` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `institution_members`
--
ALTER TABLE `institution_members`
  ADD CONSTRAINT `fk_institution_capacity` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `matches`
--
ALTER TABLE `matches`
  ADD CONSTRAINT `fk_player1` FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_player2` FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `matches_ibfk_3` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `match_chat`
--
ALTER TABLE `match_chat`
  ADD CONSTRAINT `match_chat_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_chat_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `match_chat_messages`
--
ALTER TABLE `match_chat_messages`
  ADD CONSTRAINT `match_chat_messages_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_chat_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `match_confirmations`
--
ALTER TABLE `match_confirmations`
  ADD CONSTRAINT `match_confirmations_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_confirmations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `match_disputes`
--
ALTER TABLE `match_disputes`
  ADD CONSTRAINT `match_disputes_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_disputes_ibfk_2` FOREIGN KEY (`disputing_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_disputes_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `match_proofs`
--
ALTER TABLE `match_proofs`
  ADD CONSTRAINT `match_proofs_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_proofs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `match_results`
--
ALTER TABLE `match_results`
  ADD CONSTRAINT `match_results_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  ADD CONSTRAINT `match_results_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `match_results_ibfk_3` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `match_votes`
--
ALTER TABLE `match_votes`
  ADD CONSTRAINT `match_votes_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_votes_ibfk_2` FOREIGN KEY (`voter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  ADD CONSTRAINT `notifications_ibfk_4` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`);

--
-- Constraints for table `one_vs_one_matches`
--
ALTER TABLE `one_vs_one_matches`
  ADD CONSTRAINT `fk_one_vs_one_match_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_one_vs_one_player1` FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_one_vs_one_player2` FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_one_vs_one_winner` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `one_vs_one_tournaments`
--
ALTER TABLE `one_vs_one_tournaments`
  ADD CONSTRAINT `fk_one_vs_one_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rank_history`
--
ALTER TABLE `rank_history`
  ADD CONSTRAINT `rank_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `title_awards`
--
ALTER TABLE `title_awards`
  ADD CONSTRAINT `title_awards_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`),
  ADD CONSTRAINT `title_awards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tournaments`
--
ALTER TABLE `tournaments`
  ADD CONSTRAINT `tournaments_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournaments_ibfk_2` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournaments_ibfk_3` FOREIGN KEY (`title_boundless_winner`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournaments_ibfk_4` FOREIGN KEY (`title_chaos_winner`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournaments_ibfk_5` FOREIGN KEY (`title_order_winner`) REFERENCES `users` (`id`);

--
-- Constraints for table `tournament_admins`
--
ALTER TABLE `tournament_admins`
  ADD CONSTRAINT `tournament_admins_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tournament_admins_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tournament_admins_ibfk_3` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tournament_bets`
--
ALTER TABLE `tournament_bets`
  ADD CONSTRAINT `tournament_bets_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`),
  ADD CONSTRAINT `tournament_bets_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`),
  ADD CONSTRAINT `tournament_bets_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournament_bets_ibfk_4` FOREIGN KEY (`predicted_winner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tournament_invites`
--
ALTER TABLE `tournament_invites`
  ADD CONSTRAINT `tournament_invites_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tournament_invites_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tournament_matches`
--
ALTER TABLE `tournament_matches`
  ADD CONSTRAINT `tournament_matches_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`),
  ADD CONSTRAINT `tournament_matches_ibfk_2` FOREIGN KEY (`player1_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournament_matches_ibfk_3` FOREIGN KEY (`player2_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `tournament_matches_ibfk_4` FOREIGN KEY (`winner_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  ADD CONSTRAINT `tournament_participants_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`),
  ADD CONSTRAINT `tournament_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `trust_score_history`
--
ALTER TABLE `trust_score_history`
  ADD CONSTRAINT `trust_score_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trust_score_history_ibfk_2` FOREIGN KEY (`related_match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_stats`
--
ALTER TABLE `user_stats`
  ADD CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_titles`
--
ALTER TABLE `user_titles`
  ADD CONSTRAINT `user_titles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_titles_ibfk_2` FOREIGN KEY (`title_id`) REFERENCES `titles` (`id`),
  ADD CONSTRAINT `user_titles_ibfk_3` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`);

--
-- Constraints for table `verification_timers`
--
ALTER TABLE `verification_timers`
  ADD CONSTRAINT `verification_timers_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
