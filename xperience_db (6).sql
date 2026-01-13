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

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddForeignKeysIfPossible` ()   BEGIN
    DECLARE table_exists INT;
    
    -- Check if tables exist
    SELECT COUNT(*) INTO table_exists
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name IN ('users', 'matches');
    
    IF table_exists = 2 THEN
        -- Try to update match attempts with user ranks
        UPDATE match_attempts ma
        SET ma.player1_rank = (
            SELECT u.rank FROM users u WHERE u.id = ma.player1_id LIMIT 1
        ),
        ma.player2_rank = (
            SELECT u.rank FROM users u WHERE u.id = ma.player2_id LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 FROM users u WHERE u.id = ma.player1_id
        ) AND EXISTS (
            SELECT 1 FROM users u WHERE u.id = ma.player2_id
        );
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `join_group` (IN `p_group_id` INT, IN `p_user_id` INT, IN `p_role` ENUM('admin','member'), IN `p_status` ENUM('joined','invited','requested'))   BEGIN
    DECLARE current_members INT;
    DECLARE max_members INT;
    
    -- Get current and max members
    SELECT COUNT(*) INTO current_members 
    FROM group_members 
    WHERE group_id = p_group_id AND status = 'joined';
    
    SELECT max_members INTO max_members 
    FROM groups 
    WHERE id = p_group_id;
    
    -- Check capacity
    IF current_members < max_members THEN
        -- Insert or update membership
        INSERT INTO group_members (group_id, user_id, role, status, created_at)
        VALUES (p_group_id, p_user_id, p_role, p_status, NOW())
        ON DUPLICATE KEY UPDATE 
            role = VALUES(role),
            status = VALUES(status);
        
        SELECT 'Success: User added to group' AS result;
    ELSE
        SELECT 'Error: Group has reached maximum capacity (20 members)' AS result;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `TrackPlatformRevenue` (IN `p_entity_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_entity_type` VARCHAR(50))   BEGIN
    DECLARE v_tournament_id INT DEFAULT NULL;
    DECLARE v_match_id INT DEFAULT NULL;
    
    IF p_entity_type = '1vs1_match' THEN
        SET v_match_id = p_entity_id;
        INSERT INTO `revenue` (`tournament_id`, `amount`, `revenue_date`, `notes`)
        VALUES (NULL, p_amount, NOW(), CONCAT('15% platform fee from ', p_entity_type));
    
    ELSEIF p_entity_type = 'squad_tournament' OR p_entity_type = 'onevsone_tournament' OR 
          p_entity_type = 'versus_tournament' OR p_entity_type = 'freeforall_tournament' OR 
          p_entity_type = 'survival_tournament' THEN
        SET v_tournament_id = p_entity_id;
        INSERT INTO `revenue` (`tournament_id`, `amount`, `revenue_date`, `notes`)
        VALUES (v_tournament_id, p_amount, NOW(), CONCAT('15% platform fee from ', p_entity_type));
    END IF;
END$$

--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `ValidateMatchPrizePool` (`p_prize_pool_option` ENUM('entry_fee','custom'), `p_custom_prize_pool` DECIMAL(10,2), `p_stake_amount` DECIMAL(10,2)) RETURNS TINYINT(1) DETERMINISTIC READS SQL DATA BEGIN
    IF p_prize_pool_option = 'custom' THEN
        IF p_custom_prize_pool <= 0 THEN
            RETURN FALSE;
        END IF;
        IF p_custom_prize_pool < p_stake_amount THEN
            RETURN FALSE;
        END IF;
    END IF;
    RETURN TRUE;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `ValidateTournamentPrizePool` (`p_prize_pool_option` ENUM('entry_fee','custom'), `p_custom_prize_pool` DECIMAL(10,2), `p_entry_fee` DECIMAL(10,2), `p_max_players` INT) RETURNS TINYINT(1) DETERMINISTIC READS SQL DATA BEGIN
    IF p_prize_pool_option = 'custom' THEN
        IF p_custom_prize_pool <= 0 THEN
            RETURN FALSE;
        END IF;
        IF p_custom_prize_pool < (p_entry_fee * p_max_players) THEN
            RETURN FALSE;
        END IF;
    END IF;
    RETURN TRUE;
END$$

DELIMITER ;

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

--
-- Dumping data for table `admin_activity_logs`
--

INSERT INTO `admin_activity_logs` (`id`, `admin_id`, `action_type`, `description`, `details`, `ip_address`, `user_agent`, `affected_user_id`, `affected_transaction_id`, `metadata`, `created_at`) VALUES
(1, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-17 09:34:49'),
(2, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-17 09:34:49'),
(3, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-17 09:35:44'),
(4, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-17 09:35:45'),
(5, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-17 22:12:23'),
(6, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-17 22:12:23'),
(7, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-18 18:01:43'),
(8, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2025-12-18 18:01:44'),
(9, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 14:42:09'),
(10, 1, 'view', 'Viewed withdrawal requests', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 14:42:09'),
(11, 1, 'user_update', 'Updated user profile', NULL, NULL, NULL, 1, NULL, NULL, '2026-01-12 18:49:55'),
(12, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:14:22'),
(13, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:14:23'),
(14, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:14:57'),
(15, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:15:37'),
(16, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:15:39'),
(17, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:16:15'),
(18, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:16:15'),
(19, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:16:32'),
(20, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:21:02'),
(21, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:21:02'),
(22, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:21:18'),
(23, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:33:59'),
(24, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:34:00'),
(25, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:34:06'),
(26, 1, 'transaction_status', 'Updated transaction #176 from pending_approval to completed', NULL, NULL, NULL, 8, 176, NULL, '2026-01-12 19:43:04'),
(27, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:43:04'),
(28, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:47:13'),
(29, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:47:13'),
(30, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 19:47:28'),
(31, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:17:50'),
(32, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:18:07'),
(33, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:18:09'),
(34, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:18:33'),
(35, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:18:43'),
(36, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:18:48'),
(37, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:18:56'),
(38, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:27:26'),
(39, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:27:26'),
(40, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:28:01'),
(41, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:33:17'),
(42, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 20:33:37'),
(43, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 21:31:44'),
(44, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 21:31:44'),
(45, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 21:33:37'),
(46, 1, 'match_resolution', 'Resolved match #73 - Winner: 8', '{\"adminNotes\":\"\",\"prizeAmount\":\"5946.00\",\"admin_monitoring\":0,\"final_decision\":true}', NULL, NULL, 8, NULL, NULL, '2026-01-12 21:33:45'),
(47, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-12 21:33:45'),
(48, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:01:29'),
(49, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:01:29'),
(50, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:35'),
(51, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:35'),
(52, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:35'),
(53, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:35'),
(54, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:43'),
(55, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:43'),
(56, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:43'),
(57, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:26:43'),
(58, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:37:28'),
(59, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:37:28'),
(60, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:37:28'),
(61, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:37:28'),
(62, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:37:36'),
(63, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:37:36'),
(64, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:40:09'),
(65, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:40:09'),
(66, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:40:09'),
(67, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:40:09'),
(68, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:40:22'),
(69, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:40:22'),
(70, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:41:06'),
(71, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:41:06'),
(72, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:41:09'),
(73, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:41:09'),
(74, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:41:51'),
(75, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:41:51'),
(76, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:43:00'),
(77, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:43:00'),
(78, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:44:18'),
(79, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:44:19'),
(80, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:50:10'),
(81, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:50:10'),
(82, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:50:10'),
(83, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:50:10'),
(84, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:50:35'),
(85, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:50:35'),
(86, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:58:22'),
(87, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:58:23'),
(88, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:59:02'),
(89, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:59:02'),
(90, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:59:40'),
(91, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 08:59:41'),
(92, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:25'),
(93, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:25'),
(94, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:30'),
(95, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:30'),
(96, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:30'),
(97, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:30'),
(98, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:48'),
(99, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:48'),
(100, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:56'),
(101, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:06:56'),
(102, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:10:03'),
(103, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:10:04'),
(104, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:14:24'),
(105, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:14:24'),
(106, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:15:24'),
(107, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:15:24'),
(108, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:16:00'),
(109, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:16:01'),
(110, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:01'),
(111, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:01'),
(112, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:27'),
(113, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:27'),
(114, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:37'),
(115, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:37'),
(116, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:40'),
(117, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:40'),
(118, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:42'),
(119, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:42'),
(120, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:53'),
(121, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:18:53'),
(122, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:19:00'),
(123, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:19:00'),
(124, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:04'),
(125, 1, 'view', 'Viewed transactions list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:05'),
(126, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:07'),
(127, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:07'),
(128, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:07'),
(129, 1, 'view', 'Viewed matches list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:07'),
(130, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:09'),
(131, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:10'),
(132, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:28:43'),
(133, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:30:58'),
(134, 1, 'view', 'Viewed tournaments list', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-13 09:30:58');

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

--
-- Dumping data for table `admin_logs`
--

INSERT INTO `admin_logs` (`id`, `admin_id`, `action`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, 'login', 'Admin logged in', '::1', '2025-07-21 20:07:43'),
(2, 3, 'login', 'Admin logged in', '::1', '2025-08-27 22:56:52'),
(3, 3, 'login', 'Admin logged in', '::1', '2025-08-29 03:16:06'),
(4, 3, 'match_result', 'Set winner for match #6', '::1', '2025-08-29 03:16:54'),
(5, 3, 'login', 'Admin logged in', '::1', '2025-08-29 07:26:20'),
(6, 3, 'login', 'Admin logged in', '::1', '2025-09-11 19:39:02'),
(7, 3, 'login', 'Admin logged in', '::1', '2025-09-16 03:47:06'),
(8, 3, 'create_tournament', 'Created tournament #40', '::1', '2025-09-16 05:06:49'),
(9, 3, 'update_tournament', 'Updated tournament #40', '::1', '2025-09-16 05:17:20'),
(10, 3, 'create_tournament', 'Created tournament #41', '::1', '2025-09-16 20:02:24'),
(11, 3, 'login', 'Admin logged in', '::1', '2025-09-16 20:09:05'),
(12, 3, 'create_tournament', 'Created tournament #43', '::1', '2025-09-16 20:09:55'),
(13, 3, 'login', 'Admin logged in', '::1', '2025-09-27 15:17:39'),
(14, 3, 'login', 'Admin logged in', '::1', '2025-09-28 11:44:46'),
(15, 3, 'login', 'Admin logged in', '::1', '2025-10-02 10:27:15'),
(16, 3, 'login', 'Admin logged in', '::1', '2025-10-02 10:34:15'),
(17, 3, 'login', 'Admin logged in', '::1', '2025-10-02 14:04:03'),
(18, 3, 'login', 'Admin logged in', '::1', '2025-10-03 18:47:45'),
(19, 3, 'login', 'Admin logged in', '::1', '2025-10-03 22:04:46'),
(20, 3, 'login', 'Admin logged in', '::1', '2025-10-07 13:19:38'),
(21, 3, 'login', 'Admin logged in', '::1', '2025-10-09 14:21:50'),
(22, 3, 'approve_tx', 'Approved transaction #40', '::1', '2025-10-09 14:24:53'),
(23, 3, 'login', 'Admin logged in', '::1', '2025-10-09 15:23:07'),
(24, 3, 'login', 'Admin logged in', '::1', '2025-10-11 19:32:54'),
(25, 3, 'login', 'Admin logged in', '::1', '2025-10-12 09:17:50'),
(26, 3, 'login', 'Admin logged in', '::1', '2025-10-13 12:01:43'),
(27, 3, 'login', 'Admin logged in', '::1', '2025-10-13 21:08:06'),
(28, 3, 'login', 'Admin logged in', '::1', '2025-10-14 12:57:03'),
(29, 3, 'ban_user', 'Banned user ID: 14', '::1', '2025-10-14 12:59:35'),
(30, 3, 'unban_user', 'Unbanned user ID: 14', '::1', '2025-10-14 12:59:42'),
(31, 3, 'login', 'Admin logged in', '::1', '2025-10-16 07:08:48'),
(32, 3, 'login', 'Admin logged in', '::1', '2025-10-18 08:58:13'),
(33, 3, 'approve_tx', 'Approved transaction #75', '::1', '2025-10-18 08:58:42'),
(34, 3, 'login', 'Admin logged in', '::1', '2025-10-18 09:44:34'),
(35, 3, 'approve_tx', 'Approved transaction #76', '::1', '2025-10-18 09:46:12'),
(36, 3, 'approve_tx', 'Approved transaction #79', '::1', '2025-10-18 09:49:28'),
(37, 3, 'login', 'Admin logged in', '::1', '2025-10-20 15:04:37'),
(38, 3, 'approve_tx', 'Approved transaction #80', '::1', '2025-10-20 15:07:16'),
(39, 3, 'login', 'Admin logged in', '::1', '2025-10-21 10:24:52'),
(40, 3, 'login', 'Admin logged in', '::1', '2025-10-21 10:31:38'),
(41, 3, 'login', 'Admin logged in', '::1', '2025-10-21 10:35:16'),
(42, 3, 'cancel_tournament', 'Cancelled tournament #43', '::1', '2025-10-21 10:38:52'),
(43, 3, 'cancel_tournament', 'Cancelled tournament #53', '::1', '2025-10-21 10:41:48'),
(44, 3, 'login', 'Admin logged in', '::1', '2025-10-21 15:58:06'),
(45, 3, 'send_receipt', 'Sent receipt for transaction #80 to user', '::1', '2025-10-21 15:58:47'),
(46, 3, 'approve_tx', 'Approved transaction #83', '::1', '2025-10-21 16:06:53'),
(47, 3, 'login', 'Admin logged in', '::1', '2025-10-21 16:15:34'),
(48, 3, 'login', 'Admin logged in', '::1', '2025-10-21 17:11:00'),
(49, 3, 'login', 'Admin logged in', '::1', '2025-10-21 17:25:17'),
(50, 3, 'login', 'Admin logged in', '::1', '2025-10-21 17:29:15'),
(51, 3, 'login', 'Admin logged in', '::1', '2025-10-22 17:16:46'),
(52, 3, 'cancel_tournament', 'Cancelled tournament #41', '::1', '2025-10-22 17:17:33'),
(53, 3, 'cancel_tournament', 'Cancelled tournament #35', '::1', '2025-10-22 17:18:15'),
(54, 3, 'cancel_tournament', 'Cancelled tournament #58', '::1', '2025-10-22 17:19:34'),
(55, 3, 'cancel_tournament', 'Cancelled tournament #42', '::1', '2025-10-22 17:20:09'),
(56, 3, 'cancel_tournament', 'Cancelled tournament #40', '::1', '2025-10-22 17:20:25'),
(57, 3, 'cancel_tournament', 'Cancelled tournament #36', '::1', '2025-10-22 17:20:43'),
(58, 3, 'cancel_tournament', 'Cancelled tournament #31', '::1', '2025-10-22 17:22:04'),
(59, 3, 'cancel_tournament', 'Cancelled tournament #55', '::1', '2025-10-22 17:22:17'),
(60, 3, 'login', 'Admin logged in', '::1', '2025-10-23 07:49:31'),
(61, 3, 'login', 'Admin logged in', '::1', '2025-10-23 17:20:14'),
(62, 3, 'login', 'Admin logged in', '::1', '2025-10-23 17:37:17'),
(63, 3, 'login', 'Admin logged in', '::1', '2025-10-24 06:45:22'),
(64, 3, 'login', 'Admin logged in', '::1', '2025-10-24 06:53:43'),
(65, 3, 'login', 'Admin logged in', '::1', '2025-10-25 08:47:44'),
(66, 3, 'login', 'Admin logged in', '::1', '2025-10-25 08:53:09'),
(67, 3, 'login', 'Admin logged in', '::1', '2025-10-26 07:06:17'),
(68, 3, 'login', 'Admin logged in', '::1', '2025-10-26 07:21:26'),
(69, 3, 'login', 'Admin logged in', '::1', '2025-10-26 07:29:35'),
(70, 3, 'login', 'Admin logged in', '::1', '2025-10-26 18:27:06'),
(71, 3, 'login', 'Admin logged in', '::1', '2025-10-28 12:22:00'),
(72, 3, 'delete_tournament', 'Deleted tournament #73', '::1', '2025-10-28 12:22:23'),
(73, 3, 'login', 'Admin logged in', '::1', '2025-10-31 14:55:52'),
(74, 3, 'login', 'Admin logged in', '::1', '2025-11-10 07:16:14'),
(75, 3, 'login', 'Admin logged in', '::1', '2025-11-10 20:14:54'),
(76, 3, 'login', 'Admin logged in', '::1', '2025-11-10 21:25:24'),
(77, 3, 'approve_tx', 'Approved transaction #110', '::1', '2025-11-10 21:25:59'),
(78, 3, 'boost_rank', 'Boosted rank for user ID: 16 to D', '::1', '2025-11-11 07:18:41'),
(79, 3, 'login', 'Admin logged in', '::1', '2025-11-11 07:21:40'),
(80, 3, 'login', 'Admin logged in', '::1', '2026-01-06 06:38:23');

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

--
-- Dumping data for table `admin_messages`
--

INSERT INTO `admin_messages` (`id`, `user_id`, `admin_id`, `subject`, `message`, `message_type`, `tournament_id`, `stake_amount`, `requires_response`, `user_response`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 1, 16, 'Tournament Reminder', 'Your tournament has been upcoming for over 2 months. Please consider starting it soon or it may be automatically cancelled.', 'abandoned_tournament', 0, 0.00, 0, 'pending', 0, '2025-10-23 07:51:52', '2025-10-23 07:51:52');

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

--
-- Dumping data for table `admin_monitoring_logs`
--

INSERT INTO `admin_monitoring_logs` (`id`, `tournament_id`, `match_id`, `admin_id`, `action_type`, `details`, `ip_address`, `created_at`) VALUES
(1, 98, NULL, 8, '', '{\"tournament_name\":\"conquer\",\"tournament_type\":\"squad\",\"entry_fee\":500,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-06 05:52:47'),
(2, 99, NULL, 3, '', '{\"tournament_name\":\"survive\",\"tournament_type\":\"survival\",\"entry_fee\":1020,\"admin_monitoring\":true,\"dispute_resolution\":\"admin\"}', NULL, '2026-01-07 04:44:15'),
(3, 100, NULL, 3, '', '{\"tournament_name\":\"survive\",\"tournament_type\":\"survival\",\"entry_fee\":1060,\"admin_monitoring\":true,\"dispute_resolution\":\"admin\"}', NULL, '2026-01-07 05:01:59'),
(4, 101, NULL, 8, '', '{\"tournament_name\":\"winners\",\"tournament_type\":\"freeforall\",\"entry_fee\":740,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-07 05:21:07'),
(5, 102, NULL, 15, '', '{\"tournament_name\":\"survive\",\"tournament_type\":\"squad\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-07 18:36:21'),
(6, 103, NULL, 3, '', '{\"tournament_name\":\"survivor\",\"tournament_type\":\"survival\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"admin\"}', NULL, '2026-01-08 17:32:42'),
(7, 104, NULL, 8, '', '{\"tournament_name\":\"last man standing\",\"tournament_type\":\"1v1\",\"entry_fee\":410,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-10 01:19:06'),
(8, 105, NULL, 8, '', '{\"tournament_name\":\"conquer 2\",\"tournament_type\":\"1v1\",\"entry_fee\":490,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-10 09:43:56'),
(9, 106, NULL, 8, '', '{\"tournament_name\":\"conquer 3\",\"tournament_type\":\"1v1\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-10 09:45:55'),
(10, 107, NULL, 8, '', '{\"tournament_name\":\"conquer 4\",\"tournament_type\":\"1v1\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-10 20:00:45'),
(11, 108, NULL, 8, '', '{\"tournament_name\":\"conquer 5\",\"tournament_type\":\"1v1\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-12 05:47:42'),
(12, 109, NULL, 8, '', '{\"tournament_name\":\"conquer 6\",\"tournament_type\":\"1v1\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"admin\"}', NULL, '2026-01-12 06:21:56'),
(13, 110, NULL, 8, '', '{\"tournament_name\":\"conquer 7\",\"tournament_type\":\"1v1\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"voting\"}', NULL, '2026-01-12 07:44:46'),
(14, 111, NULL, 8, '', '{\"tournament_name\":\"conquer 8\",\"tournament_type\":\"1v1\",\"entry_fee\":0,\"admin_monitoring\":true,\"dispute_resolution\":\"auto\"}', NULL, '2026-01-12 07:55:06');

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

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES
(1, 'trust_score_high_threshold', '80', '2025-09-13 23:17:11'),
(2, 'trust_score_medium_threshold', '50', '2025-09-13 23:17:11'),
(3, 'trust_score_low_threshold', '0', '2025-09-13 23:17:11'),
(4, 'verification_confirm_hours', '12', '2025-09-13 23:17:11'),
(5, 'verification_vote_hours', '24', '2025-09-13 23:17:11'),
(6, 'verification_elimination_hours', '6', '2025-09-13 23:17:11'),
(7, 'auto_confirm_threshold', '0.7', '2025-09-13 23:17:11');

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

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `username`, `email`, `password_hash`, `role`, `permissions`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@xperience.com', '$2y$10$ymA7gTXd60vCUhMdPYLXZu9vnzMCsF1LrFr5KHad3FpCSrZkyBKrm', 'super_admin', '[\"view_users\", \"view_transactions\"]', 1, NULL, '2025-12-16 22:22:58', '2025-12-17 08:37:15');

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

--
-- Dumping data for table `currency_rates`
--

INSERT INTO `currency_rates` (`id`, `base_currency`, `target_currency`, `exchange_rate`, `last_updated`, `is_active`) VALUES
(1, 'NGN', 'USD', 0.0012, '2025-12-16 11:01:33', 1),
(2, 'NGN', 'EUR', 0.0011, '2025-12-16 11:01:33', 1),
(3, 'NGN', 'GBP', 0.0009, '2025-12-16 11:01:33', 1),
(4, 'USD', 'NGN', 833.3300, '2025-12-16 11:01:33', 1),
(5, 'EUR', 'NGN', 909.0900, '2025-12-16 11:01:33', 1),
(6, 'GBP', 'NGN', 1111.1100, '2025-12-16 11:01:33', 1),
(7, 'NGN', 'USD', 0.0012, '2025-12-16 11:06:18', 1),
(8, 'NGN', 'EUR', 0.0011, '2025-12-16 11:06:18', 1),
(9, 'NGN', 'GBP', 0.0009, '2025-12-16 11:06:18', 1),
(10, 'USD', 'NGN', 833.3300, '2025-12-16 11:06:18', 1),
(11, 'EUR', 'NGN', 909.0900, '2025-12-16 11:06:18', 1),
(12, 'GBP', 'NGN', 1111.1100, '2025-12-16 11:06:18', 1),
(13, 'NGN', 'USD', 0.0012, '2025-12-16 11:10:46', 1),
(14, 'NGN', 'EUR', 0.0011, '2025-12-16 11:10:46', 1),
(15, 'NGN', 'GBP', 0.0009, '2025-12-16 11:10:46', 1),
(16, 'USD', 'NGN', 833.3300, '2025-12-16 11:10:46', 1),
(17, 'EUR', 'NGN', 909.0900, '2025-12-16 11:10:46', 1),
(18, 'GBP', 'NGN', 1111.1100, '2025-12-16 11:10:46', 1),
(19, 'NGN', 'USD', 0.0012, '2025-12-16 11:34:48', 1),
(20, 'NGN', 'EUR', 0.0011, '2025-12-16 11:34:48', 1),
(21, 'NGN', 'GBP', 0.0009, '2025-12-16 11:34:48', 1),
(22, 'USD', 'NGN', 833.3300, '2025-12-16 11:34:48', 1),
(23, 'EUR', 'NGN', 909.0900, '2025-12-16 11:34:48', 1),
(24, 'GBP', 'NGN', 1111.1100, '2025-12-16 11:34:48', 1);

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

--
-- Dumping data for table `friends`
--

INSERT INTO `friends` (`id`, `user_id`, `friend_id`, `status`, `created_at`, `chat_enabled`, `favorite`, `friendship_date`, `is_favorite`, `note`) VALUES
(1, 6, 1, 'accepted', '2025-07-07 20:30:06', 1, 0, '2025-12-05 12:50:13', 0, NULL),
(2, 1, 5, 'pending', '2025-07-17 06:21:01', 1, 0, '2025-12-05 12:50:13', 0, NULL),
(3, 4, 1, 'accepted', '2025-09-27 20:49:48', 1, 0, '2025-12-05 12:50:13', 0, NULL),
(4, 4, 8, 'accepted', '2025-10-08 10:51:40', 1, 0, '2025-12-05 12:50:13', 0, NULL),
(5, 8, 6, 'pending', '2025-12-12 08:00:46', 1, 0, '2025-12-12 08:00:46', 0, NULL),
(6, 8, 15, 'pending', '2025-12-12 08:04:22', 1, 0, '2025-12-12 08:04:22', 0, NULL),
(7, 8, 16, 'pending', '2025-12-12 08:04:40', 1, 0, '2025-12-12 08:04:40', 0, NULL),
(8, 8, 10, 'pending', '2025-12-12 08:24:02', 1, 0, '2025-12-12 08:24:02', 0, NULL),
(9, 8, 9, 'accepted', '2025-12-12 08:28:06', 1, 0, '2025-12-12 08:28:06', 0, NULL),
(10, 8, 12, 'accepted', '2025-12-13 18:40:50', 1, 0, '2025-12-13 18:40:50', 0, NULL),
(11, 8, 14, 'accepted', '2025-12-15 07:55:32', 1, 0, '2025-12-15 07:55:32', 0, NULL),
(12, 14, 4, 'accepted', '2025-12-21 13:18:28', 1, 0, '2025-12-21 13:18:28', 0, NULL);

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

--
-- Dumping data for table `friend_chat`
--

INSERT INTO `friend_chat` (`id`, `sender_id`, `receiver_id`, `message`, `is_read`, `created_at`) VALUES
(1, 4, 1, 'how far bro lets play COD', 1, '2025-09-28 11:29:19'),
(2, 1, 4, 'oya na drop link', 1, '2025-09-28 11:30:01'),
(3, 4, 1, 'ok give me a minute', 1, '2025-09-29 10:45:07'),
(4, 8, 4, 'how far  bro', 1, '2025-10-08 10:52:38'),
(5, 8, 4, 'how far  bro you up for a match', 1, '2025-10-08 10:52:51'),
(6, 4, 8, 'cod right short gun or any gun', 0, '2025-10-08 10:54:25');

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

--
-- Dumping data for table `groups`
--

INSERT INTO `groups` (`id`, `name`, `creator_id`, `game_specialty`, `description`, `created_at`, `max_members`, `visibility`) VALUES
(1, 'phoenix squad', 1, 'Call of Duty: Warzone', '', '2025-07-13 03:29:19', 20, 'public'),
(2, 'norctune', 1, 'PUBG', 'we win', '2025-07-18 06:20:59', 20, 'public'),
(3, 'mind sweeper', 4, 'Call of Duty: Warzone', 'war is what we want', '2025-07-18 06:22:59', 20, 'public'),
(4, 'Destroyer', 8, 'Call of Duty: Warzone', 'we destroy', '2025-07-29 22:36:45', 20, 'public'),
(5, 'despairity', 11, 'Call of Duty: Warzone', 'feel despair', '2025-07-31 12:09:34', 20, 'public'),
(6, 'gadus', 14, 'Fortnite', 'no be gadus be this', '2025-10-02 10:18:37', 20, 'public'),
(7, 'plaything', 16, 'Call of Duty: Warzone', 'everything na play', '2025-10-02 10:25:13', 20, 'public'),
(8, 'dust', 15, 'Call of Duty: Warzone', 'grounded to dust', '2025-10-02 10:27:51', 20, 'public'),
(9, 'Hidden leaf', 15, 'Free Fire', 'we wipe all', '2026-01-09 00:32:13', 20, 'private');

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

--
-- Dumping data for table `group_chat`
--

INSERT INTO `group_chat` (`id`, `group_id`, `user_id`, `message`, `created_at`) VALUES
(1, 4, 8, 'greeting i have joined us for a group tournament', '2025-09-27 15:20:57'),
(2, 4, 9, 'ok am in', '2025-09-27 15:24:12');

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

--
-- Dumping data for table `group_members`
--

INSERT INTO `group_members` (`id`, `group_id`, `user_id`, `role`, `status`, `created_at`) VALUES
(1, 1, 1, 'admin', 'joined', '2025-07-13 03:29:19'),
(9, 2, 1, 'admin', 'joined', '2025-07-18 06:20:59'),
(13, 3, 4, 'admin', 'joined', '2025-07-18 06:22:59'),
(17, 2, 5, 'member', 'joined', '2025-07-18 06:36:22'),
(24, 2, 6, 'member', 'joined', '2025-07-18 07:01:29'),
(29, 3, 1, 'member', 'joined', '2025-07-21 15:52:23'),
(30, 2, 4, 'member', 'joined', '2025-07-21 15:53:13'),
(31, 1, 4, 'member', 'joined', '2025-07-21 16:44:06'),
(32, 3, 7, 'member', 'joined', '2025-07-21 21:59:36'),
(33, 4, 8, 'admin', 'joined', '2025-07-29 22:36:45'),
(34, 4, 9, 'admin', 'joined', '2025-07-31 12:00:42'),
(36, 3, 10, 'member', 'joined', '2025-07-31 12:05:14'),
(37, 5, 11, 'admin', 'joined', '2025-07-31 12:09:34'),
(38, 5, 12, 'member', 'joined', '2025-07-31 12:12:30'),
(39, 5, 13, 'member', 'joined', '2025-07-31 12:14:19'),
(40, 5, 3, 'member', 'joined', '2025-08-22 23:37:01'),
(41, 6, 14, 'admin', 'joined', '2025-10-02 10:18:37'),
(46, 7, 16, 'admin', 'joined', '2025-10-02 10:25:13'),
(47, 8, 15, 'admin', 'joined', '2025-10-02 10:27:51'),
(51, 7, 8, 'member', 'joined', '2025-10-07 07:46:39'),
(54, 6, 8, 'member', 'joined', '2025-10-07 08:18:06'),
(55, 1, 8, 'member', 'joined', '2025-10-07 08:18:20'),
(56, 8, 18, 'member', 'requested', '2026-01-06 06:58:14'),
(57, 6, 18, 'member', 'joined', '2026-01-06 07:03:08'),
(58, 1, 18, 'member', 'joined', '2026-01-06 07:04:10'),
(59, 9, 15, 'admin', 'joined', '2026-01-09 00:32:13');

-- --------------------------------------------------------

--
-- Table structure for table `group_tournaments`
--

CREATE TABLE `group_tournaments` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `group_tournaments`
--

INSERT INTO `group_tournaments` (`id`, `tournament_id`, `group_id`) VALUES
(1, 22, 5),
(3, 23, 1),
(4, 23, 3),
(2, 23, 4),
(5, 25, 5),
(6, 26, 1),
(7, 26, 5);

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
-- Dumping data for table `matches`
--

INSERT INTO `matches` (`id`, `player1_id`, `player2_id`, `game_type`, `game`, `stake_amount`, `prize_pool_amount`, `custom_prize_pool`, `winner_id`, `status`, `created_at`, `scheduled_at`, `completed_at`, `duration_minutes`, `started_at`, `prize_pool_option`, `opponent_type`, `opponent_username`, `stake_currency`, `stake_currency_type`, `stake_xp_amount`, `admin_monitoring`, `match_chat_enabled`) VALUES
(1, 1, 8, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-08-25 20:06:57', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(2, 1, 8, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'ongoing', '2025-08-25 20:07:54', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(3, 9, 11, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-08-26 21:43:49', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(4, 12, 11, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'completed', '2025-08-27 01:38:51', NULL, '2025-09-13 22:43:05', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(5, 4, 9, 'individual', NULL, 0.00, 0.00, 0.00, 4, 'completed', '2025-08-27 22:38:46', NULL, '2025-08-29 03:51:03', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(6, 9, 4, 'individual', NULL, 0.00, 0.00, 0.00, 9, 'completed', '2025-08-27 22:47:47', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(7, 12, 8, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'ongoing', '2025-08-28 00:56:35', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(8, 4, 9, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'completed', '2025-08-29 02:52:50', NULL, '2025-09-14 02:32:39', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(9, 4, 8, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-08-29 03:01:04', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(10, 3, 12, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-09-08 21:55:19', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(11, 4, 6, 'individual', NULL, 0.00, 0.00, 0.00, 4, 'completed', '2025-09-08 22:01:06', NULL, '2025-09-08 22:07:44', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(12, 4, 8, 'individual', NULL, 0.00, 0.00, 0.00, 4, 'completed', '2025-09-08 22:02:29', NULL, '2025-09-16 03:38:30', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(13, 1, 8, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'ongoing', '2025-09-23 18:12:18', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(14, 9, 4, 'individual', NULL, 0.00, 0.00, 0.00, 4, 'completed', '2025-09-24 06:24:53', NULL, '2025-10-10 07:13:38', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(15, 9, 1, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-09-24 06:30:04', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(16, 9, 4, 'individual', NULL, 0.00, 0.00, 0.00, 4, 'completed', '2025-09-24 07:45:16', NULL, '2025-10-10 07:19:57', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(17, 9, 12, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-09-24 07:46:20', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(18, 9, 12, 'individual', NULL, 0.00, 0.00, 0.00, NULL, 'pending', '2025-09-24 07:47:13', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(19, 9, 4, 'individual', NULL, 0.00, 0.00, 0.00, 4, 'completed', '2025-09-24 07:48:56', NULL, '2025-10-10 07:22:22', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(22, 4, 8, 'individual', NULL, 2000.00, 0.00, 0.00, 4, 'completed', '2025-10-02 12:31:44', NULL, '2025-10-02 12:34:27', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(23, 4, 8, 'individual', NULL, 2000.00, 0.00, 0.00, 4, 'completed', '2025-10-02 13:14:12', NULL, '2025-10-10 07:17:32', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(24, 4, 1, 'individual', NULL, 800.00, 0.00, 0.00, 4, 'completed', '2025-10-03 06:33:42', NULL, '2025-10-03 21:22:47', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(25, 4, 8, 'individual', NULL, 1000.00, 0.00, 0.00, 4, 'completed', '2025-10-03 08:57:15', NULL, '2025-10-10 07:03:20', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(26, 8, 4, 'individual', NULL, 500.00, 0.00, 0.00, 4, 'completed', '2025-10-03 22:49:05', NULL, '2025-10-10 07:09:57', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(27, 8, 12, 'individual', NULL, 1000.00, 0.00, 0.00, NULL, 'ongoing', '2025-10-09 08:55:48', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(28, 8, 4, 'individual', NULL, 5000.00, 0.00, 0.00, 4, 'completed', '2025-10-10 11:24:40', NULL, '2025-10-13 11:26:07', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(29, 8, 16, 'individual', NULL, 500.00, 0.00, 0.00, 16, 'completed', '2025-10-10 16:17:36', NULL, '2025-10-13 11:57:45', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(30, 4, 8, 'individual', NULL, 1000.00, 0.00, 0.00, NULL, 'pending', '2025-10-11 17:36:53', NULL, NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(31, 8, 16, 'individual', 'Fortnite', 1000.00, 0.00, 0.00, 8, 'completed', '2025-10-11 18:34:30', '2025-10-11 19:45:00', '2025-10-11 19:21:32', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(32, 9, 14, 'individual', 'Call of Duty: Warzone', 2500.00, 0.00, 0.00, 14, 'completed', '2025-10-13 18:07:43', '2025-10-14 19:15:00', '2025-10-13 18:11:47', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(33, 14, 16, 'individual', 'Call of Duty: Warzone', 2000.00, 0.00, 0.00, 16, 'completed', '2025-10-13 18:21:32', '2025-10-14 19:30:00', '2025-10-14 12:40:46', NULL, '2025-10-14 12:39:26', 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(34, 4, 16, 'individual', 'Call of Duty: Warzone', 4000.00, 0.00, 0.00, 16, 'completed', '2025-10-13 20:39:00', '2025-10-14 21:45:00', '2025-10-13 20:41:34', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(35, 16, 4, 'individual', 'Call of Duty: Warzone', 1000.00, 0.00, 0.00, 16, 'completed', '2025-10-13 21:05:23', '2025-10-14 22:15:00', '2025-10-14 11:43:32', NULL, '2025-10-14 11:42:02', 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(36, 4, 1, 'individual', 'Call of Duty: Warzone', 2000.00, 0.00, 0.00, NULL, 'pending', '2025-10-14 07:26:20', '2025-10-15 08:30:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(37, 16, 14, 'individual', 'Call of Duty: Warzone', 2000.00, 4250.00, 0.00, 14, 'completed', '2025-10-14 12:51:55', '2025-10-15 14:00:00', '2025-10-14 12:54:53', NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(38, 4, 12, 'individual', 'Valorant', 1000.00, 2125.00, 2500.00, 12, 'completed', '2025-10-25 08:44:39', '2025-10-26 09:45:00', '2025-10-25 08:49:43', NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(39, 1, 9, 'individual', 'Dota 2', 1000.00, 2550.00, 3000.00, 9, 'completed', '2025-10-25 10:14:34', '2025-10-25 11:15:00', '2025-10-25 10:17:51', NULL, '2025-10-25 10:15:52', 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(40, 9, 14, 'individual', 'Call of Duty: Warzone', 1000.00, 2125.00, 2500.00, 9, 'completed', '2025-10-25 11:08:39', '2025-10-26 12:08:00', '2025-10-25 11:13:41', NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(41, 14, 16, 'individual', 'Fortnite', 1000.00, 2125.00, 2500.00, NULL, 'ongoing', '2025-10-26 06:59:59', '2025-10-27 07:59:00', NULL, NULL, '2025-10-26 07:08:09', 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(42, 1, 4, 'individual', 'Call of Duty: Warzone', 1000.00, 2125.00, 2500.00, NULL, 'ongoing', '2025-10-26 07:10:33', '2025-10-28 08:10:00', NULL, NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(43, 4, 6, 'individual', 'Call of Duty: Warzone', 1000.00, 2125.00, 2500.00, NULL, 'pending', '2025-10-26 07:14:40', '2025-10-27 08:14:00', NULL, NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(44, 6, 15, 'individual', 'FIFA 23', 1000.00, 2125.00, 2500.00, 15, 'completed', '2025-10-26 07:20:27', '2025-10-27 08:20:00', '2025-10-26 07:31:04', NULL, '2025-10-26 07:24:59', 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(45, 1, 3, 'individual', 'Call of Duty: Warzone', 1000.00, 2125.00, 2500.00, NULL, 'pending', '2025-10-26 08:55:19', '2025-10-28 09:55:00', NULL, NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(46, 1, 3, 'individual', 'Call of Duty: Warzone', 1000.00, 850.00, 0.00, NULL, 'pending', '2025-10-26 09:14:46', '2025-10-27 10:15:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(47, 4, 6, 'individual', 'Call of Duty: Warzone', 1000.00, 850.00, 0.00, 4, '', '2025-11-10 08:27:59', '2025-11-12 09:31:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(48, 4, 15, 'individual', 'Call of Duty: Warzone', 1000.00, 850.00, 0.00, 4, '', '2025-11-10 08:30:45', '2025-11-11 09:30:00', NULL, NULL, '2025-11-10 08:32:24', 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(49, 4, 16, 'individual', 'Call of Duty: Mobile', 1000.00, 850.00, 0.00, 4, '', '2025-11-10 08:33:52', '2025-11-11 09:45:00', NULL, NULL, '2025-11-10 08:34:50', 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(50, 4, 8, 'individual', 'Call of Duty: Mobile', 1000.00, 850.00, NULL, NULL, 'pending', '2025-11-26 22:07:39', '2025-11-28 22:07:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(51, 4, 12, 'individual', 'Call of Duty: Mobile', 1000.00, 850.00, NULL, NULL, 'pending', '2025-11-26 23:31:09', '2025-11-27 23:31:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(52, 4, 1, 'individual', 'Call of Duty: Mobile', 900.00, 765.00, NULL, NULL, 'pending', '2025-11-27 00:07:42', '2025-11-28 00:07:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(53, 4, 6, 'individual', 'Call of Duty: Mobile', 1000.00, 850.00, NULL, NULL, 'pending', '2025-11-27 20:25:02', '2025-11-28 20:24:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(54, 4, 6, 'individual', 'Call of Duty: Mobile', 1000.00, 850.00, NULL, NULL, 'pending', '2025-11-27 20:34:17', '2025-11-29 20:34:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(55, 6, 1, 'individual', 'Call of Duty: Mobile', 500.00, 425.00, NULL, NULL, 'pending', '2025-11-29 09:00:30', '2025-12-01 09:00:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(56, 4, NULL, 'individual', 'Call of Duty: Mobile', 2000.00, 10200.00, 12000.00, NULL, 'pending', '2025-12-01 20:30:21', '2025-12-03 20:30:00', NULL, NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(57, 4, NULL, 'individual', 'Call of Duty: Mobile', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-02 08:47:48', '2025-12-04 08:47:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(58, 4, NULL, 'individual', 'Call of Duty: Warzone', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-22 14:59:10', '2025-12-23 14:59:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(59, 4, NULL, 'individual', 'Call of Duty: Warzone', 900.00, 765.00, NULL, NULL, 'pending', '2025-12-22 15:00:14', '2025-12-23 15:00:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(60, 4, NULL, 'individual', 'Call of Duty: Warzone', 900.00, 765.00, NULL, NULL, 'pending', '2025-12-22 15:00:53', '2025-12-23 15:00:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(61, 4, NULL, 'individual', 'Free Fire', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-22 15:13:09', '2025-12-23 15:13:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(62, 4, 14, 'individual', 'Call of Duty: Warzone', 1000.00, 850.00, 0.00, NULL, 'pending', '2025-12-22 15:14:46', '2025-12-22 16:15:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(63, 14, NULL, 'individual', 'PUBG', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-22 15:29:34', '2025-12-23 15:29:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(64, 4, NULL, 'individual', 'Free Fire', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-22 15:56:15', '2025-12-23 15:55:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(65, 4, NULL, 'individual', 'Free Fire', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-22 15:57:38', '2025-12-23 15:55:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(66, 4, NULL, 'individual', 'Call of Duty: Warzone', 1000.00, 850.00, NULL, NULL, 'pending', '2025-12-22 16:37:33', '2025-12-23 16:37:00', NULL, NULL, NULL, 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(67, 4, 14, 'individual', 'Call of Duty: Mobile', 32.00, 64.00, NULL, NULL, 'pending', '2025-12-23 21:22:55', '2025-12-24 21:08:00', NULL, NULL, NULL, 'entry_fee', 'specific', 'pufpuf', 'xp', 'XP', 32.00, 0, 1),
(68, 4, 14, 'individual', 'Call of Duty: Warzone', 12.00, 24.00, NULL, NULL, 'pending', '2025-12-23 21:24:23', '2025-12-24 21:23:00', NULL, NULL, NULL, 'entry_fee', 'specific', 'pufpuf', 'xp', 'XP', 12.00, 0, 1),
(69, 14, NULL, 'individual', 'Call of Duty: Warzone', 2083.00, 4166.00, NULL, NULL, 'pending', '2025-12-23 21:37:21', '2025-12-24 21:36:00', NULL, NULL, NULL, 'entry_fee', 'specific', 'lenovo', 'xp', 'XP', 2083.00, 0, 1),
(70, 4, NULL, 'individual', 'Call of Duty: Warzone', 32.00, 64.00, NULL, NULL, 'pending', '2025-12-25 11:50:43', '2025-12-26 11:49:00', NULL, NULL, NULL, 'entry_fee', 'specific', 'pufpuf', 'xp', 'XP', 32.00, 0, 1),
(71, 14, 8, 'individual', 'Call of Duty: Warzone', 4973.00, 9946.00, NULL, NULL, 'ongoing', '2025-12-25 12:00:31', '2025-12-26 12:00:00', NULL, NULL, '2025-12-30 10:22:28', 'entry_fee', 'open', NULL, 'xp', 'XP', 4973.00, 0, 1),
(72, 14, 4, 'individual', 'Call of Duty: Mobile', 4973.00, 9946.00, NULL, 14, '', '2025-12-26 11:15:57', '2025-12-27 11:15:00', NULL, NULL, '2025-12-26 12:07:49', 'entry_fee', 'specific', 'lenovo', 'xp', 'XP', 4973.00, 0, 1),
(73, 14, 8, 'individual', 'Free Fire', 2973.00, 5946.00, NULL, 8, 'completed', '2025-12-26 12:17:31', '2025-12-27 12:16:00', '2026-01-12 21:33:45', NULL, '2025-12-26 12:31:31', 'entry_fee', 'specific', 'destroyer', 'xp', 'XP', 2973.00, 0, 1),
(74, 14, 8, 'individual', 'Call of Duty: Mobile', 2083.00, 4166.00, NULL, 8, 'completed', '2025-12-27 08:55:18', '2025-12-28 08:54:00', '2025-12-27 10:21:51', NULL, '2025-12-27 09:36:44', 'entry_fee', 'specific', 'destroyer', 'xp', 'XP', 2083.00, 0, 1),
(75, 8, NULL, 'individual', 'Call of Duty: Mobile', 2000.00, 4248.30, 4998.00, NULL, 'pending', '2025-12-27 09:44:12', '2025-12-28 09:44:00', NULL, NULL, NULL, 'custom', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(76, 12, 8, 'individual', 'Call of Duty: Mobile', 30000.00, 29750.00, 35000.00, 12, 'completed', '2025-12-27 10:41:56', '2025-12-28 10:41:00', '2025-12-27 10:47:08', NULL, '2025-12-27 10:42:53', 'custom', 'specific', 'destroyer', 'money', 'NGN', NULL, 0, 1),
(77, 8, 12, 'individual', 'Call of Duty: Warzone', 20200.00, 35697.45, 41997.00, 8, 'completed', '2025-12-29 10:07:15', '2025-12-31 10:06:00', '2025-12-29 10:10:28', NULL, '2025-12-29 10:09:08', 'custom', 'specific', 'kratos', 'money', 'NGN', NULL, 0, 1),
(78, 8, 14, 'individual', 'Call of Duty: Mobile', 20000.00, 35697.45, 41997.00, 8, 'completed', '2025-12-29 10:46:39', '2025-12-31 10:46:00', '2025-12-29 10:48:19', NULL, '2025-12-29 10:47:36', 'custom', 'specific', 'pufpuf', 'money', 'NGN', NULL, 0, 1),
(79, 8, 12, 'individual', 'Call of Duty: Warzone', 20000.00, 35698.30, 41998.00, 12, 'completed', '2025-12-29 17:14:48', '2025-12-30 17:14:00', '2025-12-29 17:17:38', NULL, '2025-12-29 17:16:58', 'custom', 'specific', 'kratos', 'money', 'NGN', NULL, 0, 1),
(80, 12, NULL, 'individual', 'Call of Duty: Mobile', 20000.00, 35700.00, 42000.00, NULL, 'pending', '2025-12-29 17:19:35', '2025-12-30 17:19:00', NULL, NULL, NULL, 'custom', 'specific', 'lenovo', 'money', 'NGN', NULL, 0, 1),
(81, 12, 16, 'individual', 'Call of Duty: Mobile', 14800.00, 26350.00, 31000.00, 12, 'completed', '2025-12-29 17:27:53', '2025-12-30 17:27:00', '2025-12-29 17:29:59', NULL, '2025-12-29 17:29:20', 'custom', 'specific', 'plaything', 'money', 'NGN', NULL, 0, 1),
(82, 12, NULL, 'individual', 'Call of Duty: Warzone', 9800.00, 17848.30, 20998.00, NULL, 'pending', '2025-12-29 17:40:18', '2025-12-30 17:39:00', NULL, NULL, NULL, 'custom', 'specific', 'plaything', 'money', 'NGN', NULL, 0, 1),
(83, 12, 16, 'individual', 'Call of Duty: Mobile', 4800.00, 8500.00, 10000.00, 12, 'completed', '2025-12-29 23:47:21', '2025-12-30 23:47:00', '2025-12-29 23:57:30', NULL, '2025-12-29 23:49:03', 'custom', 'specific', 'plaything', 'money', 'NGN', NULL, 0, 1),
(84, 8, 12, 'individual', 'Call of Duty: Warzone', 10000.00, 8500.00, NULL, NULL, '', '2025-12-30 10:26:15', '2025-12-31 10:26:00', NULL, NULL, '2025-12-30 10:28:24', 'entry_fee', 'open', NULL, 'money', 'NGN', NULL, 0, 1),
(85, 8, 16, 'individual', 'Call of Duty: Warzone', 4800.00, 8160.00, NULL, 8, 'completed', '2025-12-30 21:17:31', '2025-12-31 21:17:00', '2025-12-30 21:20:59', NULL, '2025-12-30 21:20:03', 'entry_fee', 'specific', 'plaything', 'money', 'NGN', NULL, 1, 1);

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

--
-- Dumping data for table `match_attempts`
--

INSERT INTO `match_attempts` (`id`, `player1_id`, `player2_id`, `player1_rank`, `player2_rank`, `match_id`, `created_at`) VALUES
(1, 9, 4, 'E', 'E', 16, '2025-09-24 00:45:16'),
(2, 9, 12, 'E', 'E', 17, '2025-09-24 00:46:20'),
(3, 9, 12, 'E', 'E', 18, '2025-09-24 00:47:13'),
(4, 9, 4, 'E', 'E', 19, '2025-09-24 00:48:56'),
(7, 4, 8, 'E', 'E', 22, '2025-10-03 01:31:44'),
(8, 8, 12, 'E', 'E', 27, '2025-10-09 21:55:48'),
(9, 8, 16, 'E', 'E', 29, '2025-10-11 05:17:36'),
(10, 8, 16, 'E', 'E', 31, '2025-10-12 07:34:30'),
(11, 9, 14, 'E', 'E', 32, '2025-10-14 07:07:43'),
(12, 4, 16, 'D', 'E', 34, '2025-10-14 09:39:00'),
(13, 16, 14, 'E', 'E', 37, '2025-10-15 01:51:56'),
(14, 4, 12, 'D', 'E', 38, '2025-10-25 21:44:41'),
(15, 1, 9, 'E', 'E', 39, '2025-10-25 23:14:34'),
(16, 9, 14, 'E', 'E', 40, '2025-10-26 00:08:40'),
(17, 14, 16, 'E', 'E', 41, '2025-10-26 19:59:59'),
(18, 1, 4, 'E', 'D', 42, '2025-10-26 20:10:34'),
(19, 4, 6, 'D', 'E', 43, '2025-10-26 20:14:40'),
(20, 4, 6, 'D', 'E', 47, '2025-11-10 21:27:59'),
(21, 4, 15, 'D', 'E', 48, '2025-11-10 21:30:45'),
(22, 4, 16, 'D', 'E', 49, '2025-11-10 21:33:52'),
(23, 4, 15, 'D', 'E', 48, '2025-12-03 02:25:38'),
(26, 4, 9, 'D', 'E', 23, '2025-12-05 21:22:53'),
(27, 8, 12, 'E', 'E', 22, '2025-12-06 00:47:21'),
(28, 8, 4, 'E', 'D', 24, '2025-12-06 00:50:59'),
(29, 4, 14, 'D', 'E', 62, '2025-12-23 04:14:46'),
(30, 14, 4, 'E', 'D', 72, '2025-12-27 01:07:49'),
(31, 14, 8, 'E', 'E', 73, '2025-12-27 01:31:31'),
(32, 14, 8, 'E', 'E', 74, '2025-12-27 22:36:44'),
(33, 12, 8, 'E', 'E', 76, '2025-12-27 23:42:53'),
(34, 8, 12, 'E', 'E', 77, '2025-12-29 23:09:08'),
(35, 8, 14, 'E', 'E', 78, '2025-12-29 23:47:36'),
(36, 8, 12, 'E', 'E', 79, '2025-12-30 06:16:59'),
(37, 12, 16, 'E', 'D', 81, '2025-12-30 06:29:20'),
(38, 12, 16, 'E', 'D', 83, '2025-12-30 12:49:03'),
(39, 14, 8, 'E', 'E', 71, '2025-12-30 23:22:28'),
(40, 8, 12, 'E', 'E', 84, '2025-12-30 23:28:24'),
(41, 8, 16, 'E', 'D', 85, '2025-12-31 10:20:03'),
(42, 16, 8, 'D', 'E', 26, '2026-01-09 23:58:34'),
(43, 12, 15, 'C', 'E', 25, '2026-01-10 00:13:19'),
(44, 8, 16, 'E', 'C', 28, '2026-01-10 01:48:00'),
(45, 9, 12, 'E', 'C', 29, '2026-01-10 01:48:31'),
(46, 8, 4, 'E', 'S', 34, '2026-01-10 12:07:46'),
(47, 12, 15, 'C', 'E', 31, '2026-01-10 12:08:40'),
(48, 17, 10, 'E', 'E', 33, '2026-01-10 12:09:09'),
(49, 9, 16, 'D', 'C', 32, '2026-01-10 12:10:53'),
(50, 12, 9, 'C', 'D', 35, '2026-01-11 21:30:27'),
(51, 8, 17, 'E', 'E', 36, '2026-01-11 21:30:59'),
(52, 16, 17, 'C', 'E', 37, '2026-01-11 21:57:17'),
(53, 10, 15, 'E', 'E', 38, '2026-01-11 21:57:46'),
(54, 4, 9, 'SS', 'D', 39, '2026-01-11 21:58:08'),
(55, 12, 8, 'B', 'E', 40, '2026-01-11 21:58:51'),
(56, 12, 4, 'B', 'SS', 42, '2026-01-11 22:08:29'),
(57, 16, 10, 'B', 'E', 41, '2026-01-11 22:09:16'),
(58, 9, 8, 'D', 'E', 44, '2026-01-11 22:24:50'),
(59, 6, 4, 'E', 'SS', 45, '2026-01-11 22:27:27'),
(60, 16, 12, 'B', 'B', 43, '2026-01-11 22:47:39'),
(61, 10, 15, 'E', 'E', 46, '2026-01-11 22:55:21'),
(62, 10, 16, 'D', 'C', 48, '2026-01-11 23:01:47'),
(63, 9, 6, 'D', 'E', 47, '2026-01-11 23:05:56'),
(64, 8, 6, 'E', 'E', 50, '2026-01-11 23:12:20'),
(65, 9, 15, 'C', 'E', 51, '2026-01-11 23:13:12'),
(66, 9, 8, 'C', 'E', 52, '2026-01-11 23:13:21'),
(67, 4, 8, 'SS', 'E', 53, '2026-01-11 23:50:08'),
(68, 16, 17, 'B', 'E', 54, '2026-01-11 23:50:36'),
(69, 12, 15, 'B', 'E', 55, '2026-01-11 23:50:59'),
(70, 10, 6, 'D', 'E', 56, '2026-01-11 23:51:32'),
(71, 12, 10, 'B', 'D', 58, '2026-01-11 23:51:58'),
(72, 4, 16, 'SS', 'C', 57, '2026-01-11 23:52:37'),
(73, 4, 12, 'SS', 'B', 59, '2026-01-11 23:52:46');

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

--
-- Dumping data for table `match_chat_messages`
--

INSERT INTO `match_chat_messages` (`id`, `match_id`, `user_id`, `message`, `is_admin`, `is_system`, `created_at`) VALUES
(1, 42, 12, 'how far', 0, 0, '2025-12-30 22:07:50'),
(2, 84, 12, 'how far', 0, 0, '2025-12-31 10:50:52'),
(3, 84, 8, 'i dey bro', 0, 0, '2025-12-31 10:51:56'),
(4, 84, 8, 'how far bro', 0, 0, '2025-12-31 11:37:22'),
(5, 84, 8, 'where you dey na', 0, 0, '2025-12-31 11:38:00'),
(6, 84, 12, 'how far', 0, 0, '2025-12-31 11:59:12'),
(7, 84, 8, 'how far bro', 0, 0, '2026-01-02 13:53:37'),
(8, 84, 12, 'i dey bro make we play one vs one', 0, 0, '2026-01-02 13:55:46'),
(9, 84, 12, 'how far bro', 0, 0, '2026-01-02 23:37:12'),
(10, 84, 12, 'celebrate grace', 0, 0, '2026-01-02 23:38:28'),
(11, 84, 12, 'how far bro', 0, 0, '2026-01-03 00:06:07'),
(12, 84, 8, 'i dey bro', 0, 0, '2026-01-03 00:06:18'),
(13, 84, 8, 'ok ihave this error in my console', 0, 0, '2026-01-03 00:07:13'),
(14, 84, 8, 'how far', 0, 0, '2026-01-03 00:09:23'),
(15, 84, 12, 'how far bro', 0, 0, '2026-01-03 00:21:50'),
(16, 84, 12, 'how life nah', 0, 0, '2026-01-03 00:22:09'),
(17, 84, 12, 'how far bro', 0, 0, '2026-01-03 00:31:50'),
(18, 84, 8, 'how far bro', 0, 0, '2026-01-03 00:45:43'),
(19, 84, 8, 'how far bro', 0, 0, '2026-01-03 01:00:10'),
(20, 84, 12, 'how u dey', 0, 0, '2026-01-03 01:01:00'),
(21, 84, 12, 'i  dey bro how your side', 0, 0, '2026-01-03 01:34:58'),
(22, 84, 8, 'good', 0, 0, '2026-01-03 01:35:09'),
(23, 84, 12, 'how far bro', 0, 0, '2026-01-03 19:48:17'),
(24, 84, 8, 'am good bro', 0, 0, '2026-01-03 19:48:53'),
(25, 84, 12, 'make we paly one vs one', 0, 0, '2026-01-03 19:49:09');

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

--
-- Dumping data for table `match_disputes`
--

INSERT INTO `match_disputes` (`id`, `match_id`, `disputing_user_id`, `reason`, `status`, `admin_id`, `resolution`, `resolved_at`, `created_at`) VALUES
(1, 84, 8, 'Players disagree on winner', 'open', NULL, NULL, NULL, '2026-01-03 19:50:06');

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

--
-- Dumping data for table `match_history`
--

INSERT INTO `match_history` (`id`, `tournament_id`, `winner_id`, `loser_id`, `winner_score`, `loser_score`, `match_date`, `is_final`, `round_number`) VALUES
(3, 91, 4, 9, 0, 0, '2025-12-05 08:22:52', 0, 1),
(4, 91, 8, 12, 0, 0, '2025-12-05 11:47:19', 0, 1),
(5, 91, 8, 4, 0, 0, '2025-12-05 11:50:58', 0, 2),
(6, 104, 16, 8, 0, 0, '2026-01-10 07:57:43', 0, 1),
(7, 104, 12, 15, 0, 0, '2026-01-10 08:13:19', 0, 1),
(8, 106, 8, 16, 0, 0, '2026-01-10 09:48:00', 0, 1),
(9, 106, 9, 12, 0, 0, '2026-01-10 09:48:31', 0, 1),
(10, 107, 8, 4, 0, 0, '2026-01-10 20:07:46', 0, 1),
(11, 107, 12, 15, 0, 0, '2026-01-10 20:08:40', 0, 1),
(12, 107, 17, 10, 0, 0, '2026-01-10 20:09:09', 0, 1),
(13, 107, 9, 16, 0, 0, '2026-01-10 20:10:53', 0, 1),
(14, 107, 12, 9, 0, 0, '2026-01-12 05:30:26', 0, 2),
(15, 107, 8, 17, 0, 0, '2026-01-12 05:30:59', 0, 2),
(16, 108, 16, 17, 0, 0, '2026-01-12 05:57:17', 0, 1),
(17, 108, 10, 15, 0, 0, '2026-01-12 05:57:46', 0, 1),
(18, 108, 4, 9, 0, 0, '2026-01-12 05:58:08', 0, 1),
(19, 108, 12, 8, 0, 0, '2026-01-12 05:58:51', 0, 1),
(20, 108, 12, 4, 0, 0, '2026-01-12 06:08:29', 0, 2),
(21, 108, 16, 10, 0, 0, '2026-01-12 06:09:16', 0, 2),
(22, 109, 9, 8, 0, 0, '2026-01-12 06:24:50', 0, 1),
(23, 109, 6, 4, 0, 0, '2026-01-12 06:27:26', 0, 1),
(24, 109, 16, 12, 0, 0, '2026-01-12 06:47:39', 0, 1),
(25, 109, 10, 15, 0, 0, '2026-01-12 06:55:21', 0, 1),
(26, 109, 10, 16, 0, 0, '2026-01-12 07:01:47', 0, 2),
(27, 109, 9, 6, 0, 0, '2026-01-12 07:05:56', 0, 2),
(28, 109, 8, 6, 0, 0, '2026-01-12 07:12:20', 0, 1),
(29, 109, 9, 15, 0, 0, '2026-01-12 07:13:12', 0, 1),
(30, 109, 9, 8, 0, 0, '2026-01-12 07:13:21', 0, 2),
(31, 110, 4, 8, 0, 0, '2026-01-12 07:50:07', 0, 1),
(32, 110, 16, 17, 0, 0, '2026-01-12 07:50:36', 0, 1),
(33, 110, 12, 15, 0, 0, '2026-01-12 07:50:59', 0, 1),
(34, 110, 10, 6, 0, 0, '2026-01-12 07:51:32', 0, 1),
(35, 110, 12, 10, 0, 0, '2026-01-12 07:51:58', 0, 2),
(36, 110, 4, 16, 0, 0, '2026-01-12 07:52:37', 0, 2),
(37, 110, 4, 12, 0, 0, '2026-01-12 07:52:46', 0, 3);

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

--
-- Dumping data for table `match_results`
--

INSERT INTO `match_results` (`id`, `match_id`, `user_id`, `winner_id`, `submitted_at`) VALUES
(1, 12, 4, 4, '2025-09-16 03:37:22'),
(2, 12, 8, 4, '2025-09-16 03:38:30'),
(3, 22, 8, 4, '2025-10-02 12:33:10'),
(4, 22, 4, 4, '2025-10-02 12:34:26'),
(5, 24, 4, 4, '2025-10-03 21:21:58'),
(6, 24, 1, 4, '2025-10-03 21:22:47'),
(7, 25, 4, 4, '2025-10-10 07:00:21'),
(8, 25, 8, 4, '2025-10-10 07:03:20'),
(9, 26, 4, 4, '2025-10-10 07:08:32'),
(10, 26, 8, 4, '2025-10-10 07:09:57'),
(11, 14, 4, 4, '2025-10-10 07:12:03'),
(12, 14, 9, 4, '2025-10-10 07:13:38'),
(13, 23, 8, 4, '2025-10-10 07:16:35'),
(14, 23, 4, 4, '2025-10-10 07:17:32'),
(15, 16, 4, 4, '2025-10-10 07:18:50'),
(16, 16, 9, 4, '2025-10-10 07:19:57'),
(17, 19, 4, 4, '2025-10-10 07:21:31'),
(18, 19, 9, 4, '2025-10-10 07:22:22'),
(19, 31, 8, 8, '2025-10-11 19:19:17'),
(20, 31, 16, 8, '2025-10-11 19:21:32'),
(21, 28, 4, 4, '2025-10-13 11:22:27'),
(22, 28, 8, 4, '2025-10-13 11:26:07'),
(23, 29, 16, 16, '2025-10-13 11:52:33'),
(24, 29, 8, 16, '2025-10-13 11:57:41'),
(25, 32, 14, 14, '2025-10-13 18:09:50'),
(26, 32, 9, 14, '2025-10-13 18:11:47'),
(27, 34, 16, 16, '2025-10-13 20:40:43'),
(28, 34, 4, 16, '2025-10-13 20:41:34'),
(29, 35, 4, 16, '2025-10-14 11:42:37'),
(30, 35, 16, 16, '2025-10-14 11:43:32'),
(31, 33, 16, 16, '2025-10-14 12:39:52'),
(32, 33, 14, 16, '2025-10-14 12:40:46'),
(33, 37, 14, 14, '2025-10-14 12:53:23'),
(34, 37, 16, 14, '2025-10-14 12:54:53'),
(35, 38, 12, 12, '2025-10-25 08:47:36'),
(36, 38, 4, 12, '2025-10-25 08:49:42'),
(37, 39, 9, 9, '2025-10-25 10:16:15'),
(38, 39, 1, 9, '2025-10-25 10:17:51'),
(39, 40, 14, 9, '2025-10-25 11:11:59'),
(40, 40, 9, 9, '2025-10-25 11:13:40'),
(41, 44, 15, 15, '2025-10-26 07:26:11'),
(42, 44, 6, 15, '2025-10-26 07:31:04'),
(43, 42, 1, 4, '2025-11-09 08:04:49'),
(44, 49, 4, 4, '2025-11-29 11:44:33'),
(45, 47, 4, 4, '2025-12-01 20:28:15'),
(49, 48, 4, 4, '2025-12-02 13:25:38'),
(50, 72, 4, 14, '2025-12-26 12:11:49'),
(51, 74, 8, 8, '2025-12-27 09:36:57'),
(52, 74, 14, 8, '2025-12-27 09:37:29'),
(53, 76, 12, 12, '2025-12-27 10:46:09'),
(54, 76, 8, 12, '2025-12-27 10:47:08'),
(55, 77, 12, 8, '2025-12-29 10:09:53'),
(56, 77, 8, 8, '2025-12-29 10:10:28'),
(57, 78, 14, 8, '2025-12-29 10:47:51'),
(58, 78, 8, 8, '2025-12-29 10:48:19'),
(59, 79, 12, 12, '2025-12-29 17:17:08'),
(60, 79, 8, 12, '2025-12-29 17:17:38'),
(61, 81, 16, 12, '2025-12-29 17:29:33'),
(62, 81, 12, 12, '2025-12-29 17:29:59'),
(63, 83, 16, 12, '2025-12-29 23:56:48'),
(64, 83, 12, 12, '2025-12-29 23:57:30'),
(65, 85, 16, 8, '2025-12-30 21:20:16'),
(66, 85, 8, 8, '2025-12-30 21:20:59'),
(67, 84, 12, 8, '2026-01-03 19:49:50'),
(68, 84, 8, 12, '2026-01-03 19:50:06');

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

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `group_id`, `message`, `message_type`, `read_status`, `created_at`) VALUES
(1, 8, NULL, 4, 'how far niggas', 'group', 0, '2025-12-11 11:10:28'),
(2, 8, 4, NULL, 'how far bro', 'private', 1, '2025-12-11 11:10:58'),
(3, 8, NULL, 4, 'i want make we particpate for that tournament na just 2k', 'group', 0, '2025-12-11 11:14:33'),
(4, 9, NULL, 4, 'sharp \nhow many players per group', 'group', 0, '2025-12-11 11:17:07'),
(5, 8, NULL, 4, 'just 5', 'group', 0, '2025-12-11 11:21:37'),
(6, 9, NULL, 4, 'see u \njust five you know how many we be', 'group', 0, '2025-12-11 11:33:31'),
(7, 8, NULL, 4, 'no fear relax we go gather more members', 'group', 0, '2025-12-11 11:34:01'),
(8, 9, NULL, 4, 'better playersoo', 'group', 0, '2025-12-11 11:34:54'),
(9, 4, 8, NULL, 'i dey bro', 'private', 1, '2025-12-11 12:52:19'),
(10, 8, 4, NULL, 'make we play one vs one', 'private', 1, '2025-12-11 12:53:46'),
(11, 4, 8, NULL, 'oya na how much you wan stake', 'private', 1, '2025-12-11 13:00:46'),
(12, 8, 4, NULL, 'i no get money', 'private', 1, '2025-12-11 13:01:06'),
(13, 4, 8, NULL, 'as how na', 'private', 1, '2025-12-11 14:36:56'),
(14, 4, 8, NULL, 'oya make we play no money', 'private', 1, '2025-12-11 14:37:40'),
(15, 8, 4, NULL, 'oya na', 'private', 1, '2025-12-11 14:38:53'),
(16, 8, 4, NULL, 'na three gameooh', 'private', 1, '2025-12-11 15:05:17'),
(17, 4, 8, NULL, 'i don hear', 'private', 1, '2025-12-11 15:07:17'),
(18, 8, 4, NULL, 'which time', 'private', 1, '2025-12-11 15:34:16'),
(19, 4, 8, NULL, 'around 2', 'private', 1, '2025-12-11 15:34:44'),
(20, 8, 4, NULL, 'make am three', 'private', 1, '2025-12-11 15:55:57'),
(21, 4, 8, NULL, 'ok no problem', 'private', 1, '2025-12-11 16:07:37'),
(22, 14, 8, NULL, 'how far bro', 'private', 1, '2025-12-15 08:57:49'),
(23, 14, 8, NULL, 'how far bro', 'private', 1, '2025-12-15 08:57:50'),
(24, 8, 14, NULL, 'i dey bro', 'private', 1, '2025-12-15 08:59:38'),
(25, 8, 14, NULL, 'i dey bro', 'private', 1, '2025-12-15 08:59:39'),
(26, 14, 8, NULL, 'make we play one vs one', 'private', 1, '2025-12-15 09:01:08'),
(27, 14, 8, NULL, 'make we play one vs one', 'private', 1, '2025-12-15 09:01:08'),
(28, 4, 14, NULL, 'how far bro', 'private', 1, '2025-12-21 13:19:29'),
(29, 4, 14, NULL, 'how far bro', 'private', 1, '2025-12-21 13:19:29'),
(30, 14, 4, NULL, 'i dey bro how your side', 'private', 1, '2025-12-21 13:20:08'),
(31, 14, 4, NULL, 'i dey bro how your side', 'private', 0, '2025-12-21 13:20:08'),
(32, 14, 4, NULL, 'omo we thank God', 'private', 1, '2025-12-21 13:21:05'),
(33, 14, 4, NULL, 'omo we thank God', 'private', 0, '2025-12-21 13:21:05'),
(34, 4, 14, NULL, 'may we play 1 vs 1', 'private', 1, '2025-12-21 13:21:22'),
(35, 4, 14, NULL, 'may we play 1 vs 1', 'private', 1, '2025-12-21 13:21:23'),
(36, 14, 4, NULL, 'oya na how much you go stake', 'private', 1, '2025-12-21 13:21:39'),
(37, 14, 4, NULL, 'oya na how much you go stake', 'private', 0, '2025-12-21 13:21:39'),
(38, 4, 14, NULL, '25 point', 'private', 1, '2025-12-21 13:21:48'),
(39, 4, 14, NULL, '25 point', 'private', 1, '2025-12-21 13:21:48'),
(40, 14, 4, NULL, 'as how na\nhe too small', 'private', 1, '2025-12-21 13:22:16'),
(41, 14, 4, NULL, 'as how na\nhe too small', 'private', 0, '2025-12-21 13:22:16'),
(42, 4, 14, NULL, 'oya 35 point', 'private', 1, '2025-12-21 13:22:28'),
(43, 4, 14, NULL, 'oya 35 point', 'private', 1, '2025-12-21 13:22:28'),
(44, 8, 12, NULL, 'how far bro', 'private', 1, '2026-01-02 14:01:22'),
(45, 12, 8, NULL, 'i dey bro', 'private', 1, '2026-01-03 00:04:35'),
(46, 12, 8, NULL, 'i dey bro', 'private', 0, '2026-01-03 00:04:35'),
(47, 8, 12, NULL, 'make we play 1 vs 1', 'private', 1, '2026-01-03 00:05:01'),
(48, 8, 12, NULL, 'make we play 1 vs 1', 'private', 0, '2026-01-03 00:05:01'),
(49, 12, 8, NULL, 'oya na', 'private', 1, '2026-01-03 00:05:30'),
(50, 12, 8, NULL, 'oya na', 'private', 0, '2026-01-03 00:05:30');

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

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `sender_id`, `message`, `type`, `status`, `match_id`, `tournament_id`, `created_at`) VALUES
(1, 1, 4, 'lenovo has joined your tournament \'group Tournament - Jul 7\'', '', 'read', NULL, 6, '2025-07-07 19:59:51'),
(2, 1, 5, 'phid has joined your tournament \'group Tournament - Jul 7\'', '', 'read', NULL, 6, '2025-07-07 20:03:41'),
(3, 1, 6, 'tomatoe has joined your tournament \'group Tournament - Jul 7\'', '', 'read', NULL, 6, '2025-07-07 20:04:37'),
(4, 4, 1, 'danex has joined your group mind sweeper', 'system', 'read', NULL, NULL, '2025-07-21 15:52:23'),
(5, 1, 4, 'lenovo has joined your group norctune', 'system', 'read', NULL, NULL, '2025-07-21 15:53:13'),
(6, 1, 4, 'lenovo has joined your group phoenix squad', 'system', 'read', NULL, NULL, '2025-07-21 16:44:06'),
(7, 4, 7, 'philip has joined your group mind sweeper', 'system', 'read', NULL, NULL, '2025-07-21 21:59:36'),
(8, 8, 9, 'mystic has joined your group Destroyer', 'system', 'unread', NULL, NULL, '2025-07-31 12:00:42'),
(9, 8, 10, 'flawless has joined your group Destroyer', 'system', 'unread', NULL, NULL, '2025-07-31 12:04:10'),
(10, 4, 10, 'flawless has joined your group mind sweeper', 'system', 'read', NULL, NULL, '2025-07-31 12:05:14'),
(11, 11, 12, 'kratos has joined your group despairity', 'system', 'unread', NULL, NULL, '2025-07-31 12:12:30'),
(12, 11, 13, 'tsunami has joined your group despairity', 'system', 'unread', NULL, NULL, '2025-07-31 12:14:19'),
(13, 11, 3, 'admin has joined your group despairity', 'system', 'unread', NULL, NULL, '2025-08-22 23:37:01'),
(14, 8, 1, 'danex has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'unread', 1, NULL, '2025-08-25 20:06:57'),
(15, 8, 1, 'danex has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 2, NULL, '2025-08-25 20:07:54'),
(16, 1, 8, 'destroyer has accepted your tournament invitation', 'system', 'read', 2, NULL, '2025-08-25 20:09:52'),
(17, 11, 9, 'mystic has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'unread', 3, NULL, '2025-08-26 21:43:49'),
(18, 8, 9, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 26', 'invite', 'unread', NULL, 28, '2025-08-26 21:45:31'),
(19, 10, 9, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 26', 'invite', 'unread', NULL, 28, '2025-08-26 21:45:31'),
(20, 11, 12, 'kratos has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 4, NULL, '2025-08-27 01:38:51'),
(21, 12, 11, 'leinado has challenged you to a  match!', 'system', 'unread', 4, NULL, '2025-08-27 01:39:36'),
(22, 12, 11, 'leinado has challenged you to a  match!', 'system', 'unread', 4, NULL, '2025-08-27 01:40:04'),
(23, 3, 11, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 28', 'invite', 'accepted', NULL, 29, '2025-08-27 22:34:01'),
(24, 12, 11, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 28', 'invite', 'accepted', NULL, 29, '2025-08-27 22:34:02'),
(25, 13, 11, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 28', 'invite', 'unread', NULL, 29, '2025-08-27 22:34:02'),
(26, 9, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 5, NULL, '2025-08-27 22:38:46'),
(27, 4, 9, 'mystic has challenged you to a  match!', 'system', 'read', 5, NULL, '2025-08-27 22:39:54'),
(28, 4, 9, 'mystic has challenged you to a  match!', 'system', 'read', 5, NULL, '2025-08-27 22:44:35'),
(29, 4, 9, 'mystic has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 6, NULL, '2025-08-27 22:47:47'),
(30, 4, 9, 'mystic has challenged you to a  match!', 'system', 'read', 5, NULL, '2025-08-27 22:49:21'),
(31, 9, 4, 'lenovo has challenged you to a  match!', 'system', 'unread', 6, NULL, '2025-08-27 22:50:38'),
(32, 11, 3, 'admin has challenged you to a  match!', 'system', 'unread', NULL, NULL, '2025-08-27 23:00:07'),
(33, 11, 12, 'kratos has accepted your challenge!', 'system', 'unread', NULL, NULL, '2025-08-28 00:56:08'),
(34, 8, 12, 'kratos has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 7, NULL, '2025-08-28 00:56:35'),
(35, 12, 8, 'destroyer has accepted your challenge!', 'system', 'unread', 7, NULL, '2025-08-28 00:57:13'),
(36, 12, 8, 'destroyer has accepted your challenge!', 'system', 'unread', 7, NULL, '2025-08-28 00:57:51'),
(37, 3, 12, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 28', 'invite', 'unread', NULL, 32, '2025-08-28 01:28:44'),
(38, 11, 12, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 28', 'invite', 'unread', NULL, 32, '2025-08-28 01:28:44'),
(39, 13, 12, 'You\'ve been invited to join a squad tournament: squad Tournament - Aug 28', 'invite', 'unread', NULL, 32, '2025-08-28 01:28:44'),
(40, 9, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'unread', 8, NULL, '2025-08-29 02:52:50'),
(41, 8, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'unread', 9, NULL, '2025-08-29 03:01:04'),
(42, 4, 9, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 5, NULL, '2025-08-29 03:51:03'),
(43, 9, 9, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 5, NULL, '2025-08-29 03:51:03'),
(44, 1, 4, 'You\'ve been invited to join a squad tournament: squad Tournament - Sep 6', 'invite', 'rejected', NULL, 34, '2025-09-06 01:25:35'),
(45, 12, 3, 'admin has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'unread', 10, NULL, '2025-09-08 21:55:19'),
(46, 6, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 11, NULL, '2025-09-08 22:01:06'),
(47, 8, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 12, NULL, '2025-09-08 22:02:29'),
(48, 4, 6, 'tomatoe has accepted your challenge!', 'system', 'read', 11, NULL, '2025-09-08 22:05:12'),
(49, 4, 4, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 11, NULL, '2025-09-08 22:07:44'),
(50, 6, 4, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 11, NULL, '2025-09-08 22:07:44'),
(51, 4, 8, 'destroyer has accepted your challenge!', 'system', 'read', 12, NULL, '2025-09-08 22:11:33'),
(52, 4, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 12, NULL, '2025-09-08 22:12:01'),
(53, 8, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 12, NULL, '2025-09-08 22:12:01'),
(54, 4, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'read', NULL, NULL, '2025-09-11 18:28:17'),
(55, 4, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'read', NULL, NULL, '2025-09-11 18:30:51'),
(56, 4, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'read', NULL, NULL, '2025-09-11 18:49:08'),
(57, 3, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'unread', NULL, NULL, '2025-09-11 19:38:58'),
(58, 3, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'unread', NULL, NULL, '2025-09-11 19:43:58'),
(59, 3, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'unread', NULL, NULL, '2025-09-11 19:44:08'),
(60, 3, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'unread', NULL, NULL, '2025-09-11 19:44:32'),
(61, 3, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'unread', NULL, NULL, '2025-09-11 20:10:55'),
(62, 4, NULL, 'Congratulations! You\'ve been promoted to  Rank - Beginner', 'system', 'read', NULL, NULL, '2025-09-11 20:24:26'),
(63, 12, 12, 'Match completed! Winner: leinado. Your stake has been distributed.', 'system', 'unread', 4, NULL, '2025-09-13 22:43:05'),
(64, 11, 12, 'Match completed! Winner: leinado. Your stake has been distributed.', 'system', 'unread', 4, NULL, '2025-09-13 22:43:05'),
(65, 4, 4, 'Match completed! Winner: mystic. Your stake has been distributed.', 'system', 'read', 8, NULL, '2025-09-14 02:32:39'),
(66, 9, 4, 'Match completed! Winner: mystic. Your stake has been distributed.', 'system', 'unread', 8, NULL, '2025-09-14 02:32:39'),
(67, 4, 8, 'destroyer has accepted your challenge!', 'system', 'read', 12, NULL, '2025-09-14 13:04:48'),
(68, 4, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 12, NULL, '2025-09-14 13:05:21'),
(69, 8, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 12, NULL, '2025-09-14 13:05:21'),
(70, 4, NULL, 'You\'re making progress toward D Rank! You have 5/10 wins needed.', 'system', 'read', NULL, NULL, '2025-09-14 13:06:57'),
(71, 4, NULL, 'You\'re making progress toward D Rank! You have 5/10 wins needed.', 'system', 'read', NULL, NULL, '2025-09-14 15:16:20'),
(72, 4, 8, 'destroyer has accepted your challenge!', 'system', 'read', 12, NULL, '2025-09-15 20:51:07'),
(73, 4, 8, 'destroyer has accepted your challenge!', 'system', 'read', 12, NULL, '2025-09-16 03:22:32'),
(74, 4, 8, 'Match completed! Winner: lenovo.', 'system', 'read', 12, NULL, '2025-09-16 03:38:30'),
(75, 8, 8, 'Match completed! Winner: lenovo.', 'system', 'unread', 12, NULL, '2025-09-16 03:38:30'),
(76, 8, 1, 'danex has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'accepted', 13, NULL, '2025-09-23 18:12:18'),
(77, 1, 8, 'destroyer has accepted your challenge!', 'system', 'read', 13, NULL, '2025-09-23 18:12:58'),
(78, 4, 9, 'mystic has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'read', 14, NULL, '2025-09-24 06:24:54'),
(79, 1, 9, 'mystic has challenged you to a Call of Duty: Warzone match with ₦0.00 stake!', 'invite', 'read', 15, NULL, '2025-09-24 06:30:04'),
(80, 4, 9, 'mystic has challenged you to a Call of Duty: Warzone match with no stake!', 'invite', 'read', 16, NULL, '2025-09-24 07:45:16'),
(81, 12, 9, 'mystic has challenged you to a Call of Duty: Warzone match with no stake!', 'invite', 'unread', 17, NULL, '2025-09-24 07:46:20'),
(82, 12, 9, 'mystic has challenged you to a Call of Duty: Warzone match with no stake!', 'invite', 'unread', 18, NULL, '2025-09-24 07:47:13'),
(83, 4, 9, 'mystic has challenged you to a Call of Duty: Warzone match with no stake!', 'invite', 'read', 19, NULL, '2025-09-24 07:48:56'),
(84, 1, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦0.00', 'invite', 'read', NULL, 44, '2025-09-26 16:34:23'),
(85, 7, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦0.00', 'invite', 'unread', NULL, 44, '2025-09-26 16:34:23'),
(86, 10, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦0.00', 'invite', 'unread', NULL, 44, '2025-09-26 16:34:23'),
(87, 1, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦0.00', 'invite', 'read', NULL, 50, '2025-09-26 18:43:22'),
(88, 7, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦0.00', 'invite', 'unread', NULL, 50, '2025-09-26 18:43:22'),
(89, 10, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦0.00', 'invite', 'unread', NULL, 50, '2025-09-26 18:43:22'),
(90, 4, 1, 'danex has registered your group for the squad tournament \'Squad Tournament - Sep 26\'!', 'invite', 'read', NULL, 50, '2025-09-26 21:10:16'),
(91, 5, 1, 'danex has registered your group for the squad tournament \'Squad Tournament - Sep 26\'!', 'invite', 'unread', NULL, 50, '2025-09-26 21:10:16'),
(92, 6, 1, 'danex has registered your group for the squad tournament \'Squad Tournament - Sep 26\'!', 'invite', 'unread', NULL, 50, '2025-09-26 21:10:16'),
(93, 1, 4, 'Tournament Announcement: ok the game will commence shortly', 'system', 'read', NULL, 50, '2025-09-27 15:10:42'),
(94, 4, 4, 'Tournament Announcement: ok the game will commence shortly', 'system', 'read', NULL, 50, '2025-09-27 15:10:42'),
(95, 5, 4, 'Tournament Announcement: ok the game will commence shortly', 'system', 'unread', NULL, 50, '2025-09-27 15:10:42'),
(96, 6, 4, 'Tournament Announcement: ok the game will commence shortly', 'system', 'unread', NULL, 50, '2025-09-27 15:10:42'),
(97, 7, 4, 'Tournament Announcement: ok the game will commence shortly', 'system', 'unread', NULL, 50, '2025-09-27 15:10:42'),
(98, 10, 4, 'Tournament Announcement: ok the game will commence shortly', 'system', 'unread', NULL, 50, '2025-09-27 15:10:42'),
(99, 9, 8, 'destroyer has registered your group for a squad tournament!', 'invite', 'unread', NULL, 50, '2025-09-27 15:19:33'),
(100, 10, 8, 'destroyer has registered your group for a squad tournament!', 'invite', 'unread', NULL, 50, '2025-09-27 15:19:33'),
(101, 3, 11, 'leinado has registered your group for a squad tournament!', 'invite', 'unread', NULL, 50, '2025-09-27 15:25:45'),
(102, 12, 11, 'leinado has registered your group for a squad tournament!', 'invite', 'unread', NULL, 50, '2025-09-27 15:25:45'),
(103, 13, 11, 'leinado has registered your group for a squad tournament!', 'invite', 'unread', NULL, 50, '2025-09-27 15:25:45'),
(104, 8, 4, 'Congratulations! Your squad won the tournament \'Squad Tournament - Sep 26\' and received ₦0.00', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(105, 9, 4, 'Your squad won the tournament \'Squad Tournament - Sep 26\'!', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(106, 10, 4, 'Your squad won the tournament \'Squad Tournament - Sep 26\'!', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(107, 1, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(108, 4, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'read', NULL, 50, '2025-09-29 17:06:31'),
(109, 5, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(110, 6, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(111, 7, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(112, 10, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(113, 3, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(114, 11, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(115, 12, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(116, 13, 4, 'Squad tournament \'Squad Tournament - Sep 26\' has been completed. Winning squad: Destroyer', 'system', 'unread', NULL, 50, '2025-09-29 17:06:31'),
(117, 9, 4, 'Congratulations! You won the tournament \'freeforall Tournament - Sep 12\' and received ₦0.00', 'system', 'unread', NULL, 37, '2025-09-29 17:08:29'),
(118, 4, 4, 'Tournament \'freeforall Tournament - Sep 12\' has been completed. Winner: mystic', 'system', 'read', NULL, 37, '2025-09-29 17:08:29'),
(119, 12, 4, 'Tournament \'freeforall Tournament - Sep 12\' has been completed. Winner: mystic', 'system', 'unread', NULL, 37, '2025-09-29 17:08:29'),
(120, 8, 1, 'Congratulations! You won the tournament \'freeforall Tournament - Oct 1\' and received ₦100,000.00', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(121, 1, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(122, 4, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'read', NULL, 51, '2025-10-02 10:09:32'),
(123, 6, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(124, 9, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(125, 10, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(126, 11, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(127, 12, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(128, 13, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(129, 14, 1, 'Tournament \'freeforall Tournament - Oct 1\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 51, '2025-10-02 10:09:32'),
(130, 9, 8, 'destroyer has registered your group for a squad tournament! Entry fee: ₦5,000.00', 'invite', 'unread', NULL, 52, '2025-10-02 10:11:16'),
(131, 10, 8, 'destroyer has registered your group for a squad tournament! Entry fee: ₦5,000.00', 'invite', 'unread', NULL, 52, '2025-10-02 10:11:16'),
(132, 1, 4, 'lenovo has registered your group for a squad tournament!', 'invite', 'rejected', NULL, 52, '2025-10-02 10:15:01'),
(133, 7, 4, 'lenovo has registered your group for a squad tournament!', 'invite', 'unread', NULL, 52, '2025-10-02 10:15:01'),
(134, 10, 4, 'lenovo has registered your group for a squad tournament!', 'invite', 'unread', NULL, 52, '2025-10-02 10:15:01'),
(135, 4, 8, 'Congratulations! Your squad won the tournament \'Squad Tournament - Oct 2\' and received ₦18,000.00', 'system', 'read', NULL, 52, '2025-10-02 10:30:42'),
(136, 1, 8, 'Your squad won the tournament \'Squad Tournament - Oct 2\'!', 'system', 'unread', NULL, 52, '2025-10-02 10:30:42'),
(137, 7, 8, 'Your squad won the tournament \'Squad Tournament - Oct 2\'!', 'system', 'unread', NULL, 52, '2025-10-02 10:30:42'),
(138, 10, 8, 'Your squad won the tournament \'Squad Tournament - Oct 2\'!', 'system', 'unread', NULL, 52, '2025-10-02 10:30:43'),
(139, 8, 8, 'Squad tournament \'Squad Tournament - Oct 2\' has been completed. Winning squad: mind sweeper', 'system', 'unread', NULL, 52, '2025-10-02 10:30:43'),
(140, 9, 8, 'Squad tournament \'Squad Tournament - Oct 2\' has been completed. Winning squad: mind sweeper', 'system', 'unread', NULL, 52, '2025-10-02 10:30:43'),
(141, 10, 8, 'Squad tournament \'Squad Tournament - Oct 2\' has been completed. Winning squad: mind sweeper', 'system', 'unread', NULL, 52, '2025-10-02 10:30:43'),
(142, 15, 8, 'Squad tournament \'Squad Tournament - Oct 2\' has been completed. Winning squad: mind sweeper', 'system', 'unread', NULL, 52, '2025-10-02 10:30:43'),
(143, 16, 8, 'Squad tournament \'Squad Tournament - Oct 2\' has been completed. Winning squad: mind sweeper', 'system', 'unread', NULL, 52, '2025-10-02 10:30:43'),
(144, 8, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦2,000.00 stake! Match scheduled for: Oct 3, 2:00 pm', 'invite', 'accepted', 22, NULL, '2025-10-02 12:31:44'),
(145, 4, 8, 'destroyer has accepted your challenge!', 'system', 'read', 22, NULL, '2025-10-02 12:32:29'),
(146, 4, 4, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 22, NULL, '2025-10-02 12:34:27'),
(147, 8, 4, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 22, NULL, '2025-10-02 12:34:27'),
(148, 4, NULL, 'You\'re making progress toward D Rank! You have 9/10 wins needed.', 'system', 'read', NULL, NULL, '2025-10-02 13:35:12'),
(149, 4, 1, 'danex has accepted your open challenge!', 'system', 'read', 24, NULL, '2025-10-03 20:26:17'),
(150, 4, 1, 'danex has accepted your match challenge!', '', 'read', 24, NULL, '2025-10-03 20:26:54'),
(151, 4, 1, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 24, NULL, '2025-10-03 21:22:47'),
(152, 1, 1, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 24, NULL, '2025-10-03 21:22:47'),
(153, 4, 8, 'destroyer has accepted your open challenge!', 'system', 'read', 25, NULL, '2025-10-03 22:31:43'),
(154, 4, 8, 'destroyer has accepted your match challenge!', '', 'read', 25, NULL, '2025-10-03 22:32:30'),
(155, 4, 8, 'destroyer has accepted your open challenge!', 'system', 'read', 23, NULL, '2025-10-03 22:34:08'),
(156, 8, 4, 'lenovo has accepted your open challenge!', 'system', 'unread', 26, NULL, '2025-10-04 10:51:31'),
(157, 8, 4, 'lenovo has accepted your match challenge! Stake amounts have been deducted.', '', 'unread', 26, NULL, '2025-10-04 10:52:52'),
(158, 1, 4, 'lenovo has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'unread', NULL, 59, '2025-10-05 11:26:02'),
(159, 1, 8, 'destroyer has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'unread', NULL, 59, '2025-10-05 11:26:46'),
(160, 1, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'unread', NULL, 59, '2025-10-05 11:27:25'),
(161, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'read', NULL, 60, '2025-10-05 20:15:38'),
(162, 4, 14, 'pufpuf has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'read', NULL, 60, '2025-10-05 20:16:14'),
(163, 4, 16, 'plaything has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'read', NULL, 60, '2025-10-05 20:17:01'),
(164, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'read', NULL, 61, '2025-10-05 20:28:37'),
(165, 4, 8, 'destroyer has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'read', NULL, 61, '2025-10-05 20:29:10'),
(166, 4, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 5\'', 'system', 'read', NULL, 61, '2025-10-05 20:29:53'),
(167, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 62, '2025-10-06 08:26:48'),
(168, 4, 8, 'destroyer has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 62, '2025-10-06 08:27:26'),
(169, 4, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 62, '2025-10-06 08:28:06'),
(170, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 63, '2025-10-06 09:13:27'),
(171, 4, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 63, '2025-10-06 09:14:14'),
(172, 4, 8, 'destroyer has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 63, '2025-10-06 09:17:23'),
(173, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 63, '2025-10-06 09:18:37'),
(174, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 63, '2025-10-06 09:18:37'),
(175, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 63, '2025-10-06 09:18:37'),
(176, 12, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 63, '2025-10-06 09:18:37'),
(177, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 64, '2025-10-06 11:12:02'),
(178, 4, 14, 'pufpuf has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 64, '2025-10-06 11:12:42'),
(179, 4, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'read', NULL, 64, '2025-10-06 11:13:20'),
(180, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 64, '2025-10-06 11:14:03'),
(181, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 64, '2025-10-06 11:14:03'),
(182, 14, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 64, '2025-10-06 11:14:03'),
(183, 12, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 64, '2025-10-06 11:14:03'),
(184, 8, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'unread', NULL, 65, '2025-10-06 15:43:18'),
(185, 8, 9, 'mystic has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'unread', NULL, 65, '2025-10-06 15:43:57'),
(186, 8, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'unread', NULL, 65, '2025-10-06 15:44:43'),
(187, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 65, '2025-10-06 15:46:03'),
(188, 12, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 65, '2025-10-06 15:46:03'),
(189, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 65, '2025-10-06 15:46:03'),
(190, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 65, '2025-10-06 15:46:03'),
(191, 8, 4, 'lenovo has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'unread', NULL, 66, '2025-10-06 16:32:32'),
(192, 8, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'unread', NULL, 66, '2025-10-06 16:33:09'),
(193, 8, 9, 'mystic has joined your 1v1 tournament \'1v1 Tournament - Oct 6\'', 'system', 'unread', NULL, 66, '2025-10-06 16:33:44'),
(194, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 66, '2025-10-06 16:34:34'),
(195, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 66, '2025-10-06 16:34:35'),
(196, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 66, '2025-10-06 16:34:35'),
(197, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 66, '2025-10-06 16:34:35'),
(198, 16, 8, 'destroyer has joined your group plaything', 'system', 'unread', NULL, NULL, '2025-10-07 07:46:39'),
(199, 14, 8, 'destroyer has joined your group gadus', 'system', 'unread', NULL, NULL, '2025-10-07 08:18:06'),
(200, 1, 8, 'destroyer has joined your group phoenix squad', 'system', 'unread', NULL, NULL, '2025-10-07 08:18:20'),
(201, 8, 4, 'lenovo has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'unread', NULL, 67, '2025-10-07 08:27:15'),
(202, 8, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'unread', NULL, 67, '2025-10-07 08:28:19'),
(203, 8, 16, 'plaything has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'unread', NULL, 67, '2025-10-07 08:29:02'),
(204, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 67, '2025-10-07 08:29:58'),
(205, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 67, '2025-10-07 08:29:58'),
(206, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 67, '2025-10-07 08:29:58'),
(207, 16, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 67, '2025-10-07 08:29:58'),
(208, 8, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'unread', NULL, 68, '2025-10-07 12:57:43'),
(209, 8, 4, 'lenovo has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'unread', NULL, 68, '2025-10-07 12:58:29'),
(210, 8, 9, 'mystic has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'unread', NULL, 68, '2025-10-07 12:59:13'),
(211, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 68, '2025-10-07 13:00:28'),
(212, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 68, '2025-10-07 13:00:28'),
(213, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 68, '2025-10-07 13:00:28'),
(214, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 68, '2025-10-07 13:00:28'),
(215, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'read', NULL, 69, '2025-10-07 13:57:55'),
(216, 4, 9, 'mystic has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'read', NULL, 69, '2025-10-07 13:58:54'),
(217, 4, 8, 'destroyer has joined your 1v1 tournament \'1v1 Tournament - Oct 7\'', 'system', 'read', NULL, 69, '2025-10-07 13:59:38'),
(218, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 69, '2025-10-07 14:00:32'),
(219, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 69, '2025-10-07 14:00:32'),
(220, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 69, '2025-10-07 14:00:32'),
(221, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 7\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 69, '2025-10-07 14:00:32'),
(222, 8, 4, 'Congratulations! You won the 1v1 tournament \'1v1 Tournament - Oct 7\' and received ₦3,400.00', 'system', 'unread', NULL, 69, '2025-10-08 20:44:38'),
(223, 1, 4, '1v1 Tournament \'1v1 Tournament - Oct 7\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 69, '2025-10-08 20:44:38'),
(224, 4, 4, '1v1 Tournament \'1v1 Tournament - Oct 7\' has been completed. Winner: destroyer', 'system', 'read', NULL, 69, '2025-10-08 20:44:38'),
(225, 9, 4, '1v1 Tournament \'1v1 Tournament - Oct 7\' has been completed. Winner: destroyer', 'system', 'unread', NULL, 69, '2025-10-08 20:44:38'),
(226, 12, 8, 'destroyer has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake! Match scheduled for: Oct 10, 11:00 pm', 'invite', 'accepted', 27, NULL, '2025-10-09 08:55:48'),
(227, 8, 12, 'kratos has accepted your challenge!', 'system', 'unread', 27, NULL, '2025-10-09 08:57:02'),
(228, 4, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 25, NULL, '2025-10-10 07:03:21'),
(229, 8, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 25, NULL, '2025-10-10 07:03:21'),
(230, 8, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 26, NULL, '2025-10-10 07:09:57'),
(231, 4, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 26, NULL, '2025-10-10 07:09:57'),
(232, 9, 4, 'lenovo has accepted your match challenge!', '', 'unread', 14, NULL, '2025-10-10 07:11:43'),
(233, 9, 9, 'Match completed! Winner: lenovo.', 'system', 'unread', 14, NULL, '2025-10-10 07:13:38'),
(234, 4, 9, 'Match completed! Winner: lenovo.', 'system', 'read', 14, NULL, '2025-10-10 07:13:38'),
(235, 4, 8, 'destroyer has accepted your match challenge! Stake amounts have been deducted.', '', 'read', 23, NULL, '2025-10-10 07:15:42'),
(236, 4, 4, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'read', 23, NULL, '2025-10-10 07:17:33'),
(237, 8, 4, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 23, NULL, '2025-10-10 07:17:33'),
(238, 9, 4, 'lenovo has accepted your match challenge!', '', 'unread', 16, NULL, '2025-10-10 07:18:30'),
(239, 9, 9, 'Match completed! Winner: lenovo.', 'system', 'unread', 16, NULL, '2025-10-10 07:19:57'),
(240, 4, 9, 'Match completed! Winner: lenovo.', 'system', 'read', 16, NULL, '2025-10-10 07:19:57'),
(241, 9, 4, 'lenovo has accepted your match challenge!', '', 'unread', 19, NULL, '2025-10-10 07:21:10'),
(242, 9, 9, 'Match completed! Winner: lenovo.', 'system', 'unread', 19, NULL, '2025-10-10 07:22:22'),
(243, 4, 9, 'Match completed! Winner: lenovo.', 'system', 'read', 19, NULL, '2025-10-10 07:22:22'),
(244, 4, NULL, 'Congratulations! You\'ve been promoted to D Rank - Intermediate', 'system', 'read', NULL, NULL, '2025-10-10 07:23:04'),
(245, 4, NULL, 'Congratulations! You\'ve been promoted to D Rank - Intermediate', 'system', 'read', NULL, NULL, '2025-10-10 07:23:04'),
(246, 8, 4, 'lenovo has accepted your open challenge!', 'system', 'unread', 28, NULL, '2025-10-10 11:25:26'),
(247, 8, 4, 'lenovo has accepted your match challenge! Stake amounts have been deducted.', '', 'unread', 28, NULL, '2025-10-10 11:26:24'),
(248, 16, 8, 'destroyer has challenged you to a Call of Duty: Warzone match with ₦500.00 stake! Match scheduled for: Oct 11, 6:30 am', 'invite', 'accepted', 29, NULL, '2025-10-10 16:17:36'),
(249, 8, 16, 'plaything has accepted your challenge!', 'system', 'unread', 29, NULL, '2025-10-10 16:18:02'),
(250, 4, 8, 'destroyer has accepted your open challenge!', 'system', 'read', 30, NULL, '2025-10-11 17:40:00'),
(251, 16, 8, 'destroyer has challenged you to a Fortnite match with ₦1,000.00 stake! Match scheduled for: Oct 12, 8:45 am', 'invite', 'accepted', 31, NULL, '2025-10-11 18:34:30'),
(252, 8, 16, 'plaything has accepted your challenge!', 'system', 'unread', 31, NULL, '2025-10-11 18:35:59'),
(253, 8, 16, 'Match completed! Winner: destroyer. Your stake has been distributed.', 'system', 'unread', 31, NULL, '2025-10-11 19:21:52'),
(254, 16, 16, 'Match completed! Winner: destroyer. Your stake has been distributed.', 'system', 'unread', 31, NULL, '2025-10-11 19:21:52'),
(255, 4, 8, 'destroyer has joined your 1v1 tournament \'1v1 Tournament - Oct 11\'', 'system', 'read', NULL, 70, '2025-10-11 20:24:34'),
(256, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 11\'', 'system', 'read', NULL, 70, '2025-10-11 20:26:46'),
(257, 4, 9, 'mystic has joined your 1v1 tournament \'1v1 Tournament - Oct 11\'', 'system', 'read', NULL, 70, '2025-10-11 20:29:01'),
(258, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 70, '2025-10-11 20:31:18'),
(259, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 70, '2025-10-11 20:31:18'),
(260, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 70, '2025-10-11 20:31:18'),
(261, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 70, '2025-10-11 20:31:18'),
(262, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 70, '2025-10-12 09:11:24'),
(263, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 70, '2025-10-12 09:11:25'),
(264, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 70, '2025-10-12 09:11:25'),
(265, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 11\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 70, '2025-10-12 09:11:25'),
(266, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'read', NULL, 62, '2025-10-12 10:32:34'),
(267, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 62, '2025-10-12 10:32:34'),
(268, 8, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 62, '2025-10-12 10:32:34'),
(269, 12, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 6\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 62, '2025-10-12 10:32:34'),
(270, 4, 1, 'danex has joined your 1v1 tournament \'1v1 Tournament - Oct 12\'', 'system', 'unread', NULL, 71, '2025-10-12 12:29:37'),
(271, 4, 9, 'mystic has joined your 1v1 tournament \'1v1 Tournament - Oct 12\'', 'system', 'unread', NULL, 71, '2025-10-12 12:30:33'),
(272, 4, 12, 'kratos has joined your 1v1 tournament \'1v1 Tournament - Oct 12\'', 'system', 'unread', NULL, 71, '2025-10-12 12:31:09'),
(273, 4, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 12\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 71, '2025-10-12 12:31:52'),
(274, 1, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 12\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 71, '2025-10-12 12:31:52'),
(275, 9, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 12\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 71, '2025-10-12 12:31:52'),
(276, 12, NULL, 'The 1v1 tournament \'1v1 Tournament - Oct 12\' has started! Check your match in the tournament bracket.', 'system', 'unread', NULL, 71, '2025-10-12 12:31:52'),
(277, 4, 4, 'Congratulations! You won the 1v1 tournament \'1v1 Tournament - Oct 12\' and received ₦0.00', 'system', 'unread', NULL, 71, '2025-10-13 11:19:42'),
(278, 1, 4, '1v1 Tournament \'1v1 Tournament - Oct 12\' has been completed. Winner: lenovo', 'system', 'unread', NULL, 71, '2025-10-13 11:19:42'),
(279, 9, 4, '1v1 Tournament \'1v1 Tournament - Oct 12\' has been completed. Winner: lenovo', 'system', 'unread', NULL, 71, '2025-10-13 11:19:42'),
(280, 12, 4, '1v1 Tournament \'1v1 Tournament - Oct 12\' has been completed. Winner: lenovo', 'system', 'unread', NULL, 71, '2025-10-13 11:19:42'),
(281, 8, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 28, NULL, '2025-10-13 11:26:08'),
(282, 4, 8, 'Match completed! Winner: lenovo. Your stake has been distributed.', 'system', 'unread', 28, NULL, '2025-10-13 11:26:08'),
(283, 8, 8, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 29, NULL, '2025-10-13 11:58:02'),
(284, 16, 8, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 29, NULL, '2025-10-13 11:58:05'),
(285, 14, 9, 'mystic has challenged you to a Call of Duty: Warzone match with ₦2,500.00 stake! Match scheduled for: Oct 15, 8:15 am', 'invite', 'accepted', 32, NULL, '2025-10-13 18:07:43'),
(286, 9, 14, 'pufpuf has accepted your challenge!', 'system', 'unread', 32, NULL, '2025-10-13 18:09:00'),
(287, 9, 14, 'pufpuf has accepted your challenge!', 'system', 'unread', 32, NULL, '2025-10-13 18:09:31'),
(288, 9, 9, 'Match completed! Winner: pufpuf. Your stake has been distributed.', 'system', 'unread', 32, NULL, '2025-10-13 18:11:48'),
(289, 14, 9, 'Match completed! Winner: pufpuf. Your stake has been distributed.', 'system', 'unread', 32, NULL, '2025-10-13 18:11:48'),
(290, 16, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦4,000.00 stake! Match scheduled for: Oct 15, 10:45 am', 'invite', 'accepted', 34, NULL, '2025-10-13 20:39:00'),
(291, 4, 16, 'plaything has accepted your challenge!', 'system', 'unread', 34, NULL, '2025-10-13 20:40:09'),
(292, 4, 4, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 34, NULL, '2025-10-13 20:41:34'),
(293, 16, 4, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 34, NULL, '2025-10-13 20:41:34'),
(294, 14, 16, 'plaything has accepted your open challenge!', 'system', 'unread', 33, NULL, '2025-10-13 21:03:08'),
(295, 16, 4, 'lenovo has accepted your open challenge!', 'system', 'unread', 35, NULL, '2025-10-14 07:24:31'),
(296, 4, 1, 'danex has accepted your open challenge!', 'system', 'unread', 36, NULL, '2025-10-14 07:28:26'),
(297, 16, 4, 'lenovo has accepted your 1vs1 match challenge!', '', 'unread', 35, NULL, '2025-10-14 11:42:02'),
(298, 16, 16, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 35, NULL, '2025-10-14 11:43:32'),
(299, 4, 16, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 35, NULL, '2025-10-14 11:43:32'),
(300, 14, 16, 'plaything has accepted your 1vs1 match challenge!', '', 'unread', 33, NULL, '2025-10-14 12:39:26'),
(301, 14, 14, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 33, NULL, '2025-10-14 12:40:47'),
(302, 16, 14, 'Match completed! Winner: plaything. Your stake has been distributed.', 'system', 'unread', 33, NULL, '2025-10-14 12:40:47'),
(303, 14, 16, 'plaything has challenged you to a Call of Duty: Warzone match with ₦2,000.00 stake and ₦5,000.00 prize pool! Match scheduled for: Oct 16, 3:00 am', 'invite', 'accepted', 37, NULL, '2025-10-14 12:51:56'),
(304, 16, 14, 'pufpuf has accepted your challenge!', 'system', 'unread', 37, NULL, '2025-10-14 12:52:59'),
(305, 16, 16, 'Match completed! Winner: pufpuf. Your stake has been distributed.', 'system', 'unread', 37, NULL, '2025-10-14 12:54:57'),
(306, 14, 16, 'Match completed! Winner: pufpuf. Your stake has been distributed.', 'system', 'unread', 37, NULL, '2025-10-14 12:54:57'),
(307, 4, NULL, 'Your transaction receipt for XTX-1760972803-b37d4cc2 is now available. You can download it from your wallet page.', 'system', 'unread', NULL, NULL, '2025-10-21 15:58:47'),
(308, 1, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦5,000.00', 'invite', 'unread', NULL, 72, '2025-10-21 17:09:51'),
(309, 7, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦5,000.00', 'invite', 'unread', NULL, 72, '2025-10-21 17:09:51'),
(310, 10, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦5,000.00', 'invite', 'unread', NULL, 72, '2025-10-21 17:09:51'),
(311, 8, 14, 'pufpuf has registered your group for a squad tournament!', 'invite', 'unread', NULL, 72, '2025-10-21 17:20:15'),
(312, 3, 11, 'leinado has registered your group for a squad tournament!', 'invite', 'unread', NULL, 72, '2025-10-21 17:21:50'),
(313, 12, 11, 'leinado has registered your group for a squad tournament!', 'invite', 'unread', NULL, 72, '2025-10-21 17:21:50'),
(314, 13, 11, 'leinado has registered your group for a squad tournament!', 'invite', 'unread', NULL, 72, '2025-10-21 17:21:50'),
(315, 1, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:09'),
(316, 4, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(317, 7, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(318, 10, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(319, 3, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(320, 11, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(321, 12, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(322, 13, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(323, 8, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(324, 14, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(325, 15, 4, 'Tournament Announcement: the time as finally come', 'system', 'unread', NULL, 72, '2025-10-21 17:24:10'),
(326, 14, 4, 'Congratulations! Your squad won the tournament \'Squad Tournament - Oct 21\' and received ₦17,000.00', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(327, 8, 4, 'Your squad won the tournament \'Squad Tournament - Oct 21\'!', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(328, 1, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(329, 4, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(330, 7, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(331, 10, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(332, 3, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(333, 11, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(334, 12, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(335, 13, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(336, 15, 4, 'Squad tournament \'Squad Tournament - Oct 21\' has been completed. Winning squad: gadus', 'system', 'unread', NULL, 72, '2025-10-21 17:25:33'),
(337, 1, 4, 'You received ₦5,000.00 from lenovo', 'system', 'unread', NULL, NULL, '2025-10-23 17:18:24'),
(339, 1, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(340, 4, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(341, 5, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(342, 6, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(343, 7, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(344, 8, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(345, 9, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(346, 10, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(347, 11, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(348, 12, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(349, 13, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35');
INSERT INTO `notifications` (`id`, `user_id`, `sender_id`, `message`, `type`, `status`, `match_id`, `tournament_id`, `created_at`) VALUES
(350, 14, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(351, 15, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:35'),
(352, 16, 4, 'Upcoming Tournaments This Week: Check out these exciting tournaments starting soon:\n\n• 1v1 Tournament - Oct 24 (Call of Duty: Warzone) - Oct 26, 7:00 PM - Entry: ₦2,000.00 - Prize: ₦13,600.00\n\nDon\'t miss your chance to compete and win!', 'system', 'unread', NULL, NULL, '2025-10-24 06:51:36'),
(354, 4, 1, 'dear customer your system as been verified: HOW FAR BROS', 'system', 'unread', NULL, NULL, '2025-10-24 07:41:38'),
(355, 1, 4, 'You received ₦2,000.00 from lenovo', 'system', 'unread', NULL, NULL, '2025-10-24 21:27:35'),
(356, 12, 4, 'lenovo has challenged you to a Valorant match with ₦1,000.00 stake and ₦2,500.00 prize pool! Match scheduled for: Oct 26, 10:45 pm', 'invite', 'accepted', 38, NULL, '2025-10-25 08:44:41'),
(357, 4, 12, 'kratos has accepted your challenge!', 'system', 'unread', 38, NULL, '2025-10-25 08:45:29'),
(358, 4, 4, 'Match completed! Winner: kratos. Your stake has been distributed.', 'system', 'unread', 38, NULL, '2025-10-25 08:49:48'),
(359, 12, 4, 'Match completed! Winner: kratos. Your stake has been distributed.', 'system', 'unread', 38, NULL, '2025-10-25 08:49:49'),
(360, 9, 1, 'danex has challenged you to a Dota 2 match with ₦1,000.00 stake and ₦3,000.00 prize pool! Match scheduled for: Oct 26, 12:15 am', 'invite', 'unread', 39, NULL, '2025-10-25 10:14:34'),
(361, 1, 9, 'mystic has accepted your 1vs1 match challenge!', '', 'unread', 39, NULL, '2025-10-25 10:15:52'),
(362, 1, 1, 'Match completed! Winner: mystic. Stakes returned to creator, prize pool awarded to winner.', 'system', 'unread', 39, NULL, '2025-10-25 10:17:51'),
(363, 9, 1, 'Match completed! Winner: mystic. Stakes returned to creator, prize pool awarded to winner.', 'system', 'unread', 39, NULL, '2025-10-25 10:17:51'),
(364, 14, 9, 'mystic has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake and ₦2,500.00 prize pool! Match scheduled for: Oct 27, 1:08 am', 'invite', 'accepted', 40, NULL, '2025-10-25 11:08:40'),
(365, 9, 14, 'pufpuf has accepted your challenge!', 'system', 'unread', 40, NULL, '2025-10-25 11:10:11'),
(366, 9, 9, 'Match completed! Winner: mystic. Stakes returned to creator, prize pool awarded to winner.', 'system', 'unread', 40, NULL, '2025-10-25 11:13:41'),
(367, 14, 9, 'Match completed! Winner: mystic. Stakes returned to creator, prize pool awarded to winner.', 'system', 'unread', 40, NULL, '2025-10-25 11:13:41'),
(368, 16, 14, 'pufpuf has challenged you to a Fortnite match with ₦1,000.00 stake and ₦2,500.00 prize pool! Match scheduled for: Oct 27, 8:59 pm', 'invite', 'unread', 41, NULL, '2025-10-26 06:59:59'),
(369, 14, 16, 'plaything has accepted your 1vs1 match challenge!', '', 'unread', 41, NULL, '2025-10-26 07:08:09'),
(370, 4, 1, 'danex has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake and ₦2,500.00 prize pool! Match scheduled for: Oct 28, 9:10 pm', 'invite', 'accepted', 42, NULL, '2025-10-26 07:10:34'),
(371, 1, 4, 'lenovo has accepted your challenge!', 'system', 'unread', 42, NULL, '2025-10-26 07:12:06'),
(372, 6, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake and ₦2,500.00 prize pool! Match scheduled for: Oct 27, 9:14 pm', 'invite', 'unread', 43, NULL, '2025-10-26 07:14:40'),
(373, 6, 15, 'gradust has accepted your open challenge!', 'system', 'unread', 44, NULL, '2025-10-26 07:22:56'),
(374, 6, 15, 'gradust has accepted your 1vs1 match challenge!', '', 'unread', 44, NULL, '2025-10-26 07:24:59'),
(375, 6, 6, 'Match completed! Winner: gradust. Stakes returned to creator, prize pool awarded to winner.', 'system', 'unread', 44, NULL, '2025-10-26 07:31:05'),
(376, 15, 6, 'Match completed! Winner: gradust. Stakes returned to creator, prize pool awarded to winner.', 'system', 'unread', 44, NULL, '2025-10-26 07:31:05'),
(377, 1, 4, 'lenovo has accepted your challenge!', 'system', 'unread', 42, NULL, '2025-10-26 18:41:32'),
(378, 4, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦1,000.00', 'invite', 'unread', NULL, 78, '2025-10-28 14:19:58'),
(379, 5, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦1,000.00', 'invite', 'unread', NULL, 78, '2025-10-28 14:19:58'),
(380, 6, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦1,000.00', 'invite', 'unread', NULL, 78, '2025-10-28 14:19:58'),
(381, 1, 4, 'lenovo has joined your 1v1 tournament \'1v1 Tournament - Oct 28\'', 'system', 'unread', NULL, 74, '2025-10-31 15:13:06'),
(382, 1, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦1,000.00', 'invite', 'unread', NULL, 80, '2025-10-31 15:39:54'),
(383, 7, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦1,000.00', 'invite', 'unread', NULL, 80, '2025-10-31 15:39:54'),
(384, 10, 4, 'lenovo has registered your group for a squad tournament! Entry fee: ₦1,000.00', 'invite', 'unread', NULL, 80, '2025-10-31 15:39:54'),
(385, 4, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦6,000.00', 'invite', 'unread', NULL, 81, '2025-10-31 15:56:34'),
(386, 5, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦6,000.00', 'invite', 'unread', NULL, 81, '2025-10-31 15:56:34'),
(387, 6, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦6,000.00', 'invite', 'unread', NULL, 81, '2025-10-31 15:56:34'),
(388, 4, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦7,000.00', 'invite', 'unread', NULL, 84, '2025-11-08 21:47:38'),
(389, 5, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦7,000.00', 'invite', 'unread', NULL, 84, '2025-11-08 21:47:38'),
(390, 6, 1, 'danex has registered your group for a squad tournament! Entry fee: ₦7,000.00', 'invite', 'unread', NULL, 84, '2025-11-08 21:47:38'),
(391, 6, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake! Match scheduled for: Nov 12, 10:31 pm', 'invite', 'accepted', 47, NULL, '2025-11-10 08:27:59'),
(392, 4, 6, 'tomatoe has accepted your challenge!', 'system', 'unread', 47, NULL, '2025-11-10 08:28:48'),
(393, 15, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake! Match scheduled for: Nov 11, 10:30 pm', 'invite', 'unread', 48, NULL, '2025-11-10 08:30:45'),
(394, 4, 15, 'gradust has accepted your 1vs1 match challenge!', '', 'unread', 48, NULL, '2025-11-10 08:32:24'),
(395, 16, 4, 'lenovo has challenged you to a Call of Duty: Mobile match with ₦1,000.00 stake! Match scheduled for: Nov 11, 10:45 pm', 'invite', 'unread', 49, NULL, '2025-11-10 08:33:52'),
(396, 4, 16, 'plaything has accepted your 1vs1 match challenge!', '', 'unread', 49, NULL, '2025-11-10 08:34:50'),
(397, 1, 3, 'admin has accepted your open challenge!', 'system', 'unread', 46, NULL, '2025-11-11 09:31:54'),
(398, 1, 3, 'admin has accepted your open challenge!', 'system', 'unread', 45, NULL, '2025-11-11 09:46:46'),
(399, 4, 4, 'lenovo has joined your tournament \'WAR\'', 'system', 'unread', NULL, 88, '2025-12-01 20:23:51'),
(400, 4, 4, 'lenovo has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-01 20:24:47'),
(401, 15, 4, 'lenovo submitted a match result. Please confirm.', 'system', 'unread', 48, NULL, '2025-12-02 13:25:38'),
(402, 4, 6, 'tomatoe has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:33:10'),
(403, 4, 16, 'plaything has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:34:50'),
(404, 4, 8, 'destroyer has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:35:54'),
(405, 4, 9, 'mystic has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:37:21'),
(406, 4, 15, 'gradust has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:41:28'),
(407, 4, 10, 'flawless has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:45:02'),
(408, 4, 12, 'kratos has joined your tournament \'the first\'', 'system', 'unread', NULL, 89, '2025-12-02 21:45:50'),
(409, 4, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(410, 6, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(411, 8, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(412, 9, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(413, 10, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(414, 12, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(415, 15, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(416, 16, NULL, 'Tournament \'the first\' has started! Check your matches.', 'system', 'unread', NULL, 89, '2025-12-03 10:45:52'),
(417, 4, 8, 'destroyer has joined your tournament \'Test Tournament\'', 'system', 'unread', NULL, 91, '2025-12-03 17:37:29'),
(418, 4, 9, 'mystic has joined your tournament \'Test Tournament\'', 'system', 'unread', NULL, 91, '2025-12-03 17:37:55'),
(419, 4, 12, 'kratos has joined your tournament \'Test Tournament\'', 'system', 'unread', NULL, 91, '2025-12-03 17:38:28'),
(420, 4, 4, 'lenovo has joined your tournament \'Test Tournament\'', 'system', 'unread', NULL, 91, '2025-12-03 17:40:49'),
(421, 4, NULL, 'Tournament \'Test Tournament\' has started! Check your matches.', 'system', 'unread', NULL, 91, '2025-12-03 17:41:09'),
(422, 8, NULL, 'Tournament \'Test Tournament\' has started! Check your matches.', 'system', 'unread', NULL, 91, '2025-12-03 17:41:09'),
(423, 9, NULL, 'Tournament \'Test Tournament\' has started! Check your matches.', 'system', 'unread', NULL, 91, '2025-12-03 17:41:09'),
(424, 12, NULL, 'Tournament \'Test Tournament\' has started! Check your matches.', 'system', 'unread', NULL, 91, '2025-12-03 17:41:09'),
(425, 4, 4, 'You won your match in tournament!', 'system', 'unread', 23, 91, '2025-12-05 08:22:53'),
(426, 9, 4, 'Match result submitted for tournament.', 'system', 'unread', 23, 91, '2025-12-05 08:22:54'),
(427, 8, 8, 'You won your match in tournament!', 'system', 'unread', 22, 91, '2025-12-05 11:47:22'),
(428, 12, 8, 'Match result submitted for tournament.', 'system', 'unread', 22, 91, '2025-12-05 11:47:22'),
(429, 8, 4, 'You won your match in tournament!', 'system', 'unread', 24, 91, '2025-12-05 11:50:59'),
(430, 4, 4, 'Match result submitted for tournament.', 'system', 'unread', 24, 91, '2025-12-05 11:50:59'),
(431, 6, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-12 08:00:46'),
(432, 15, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-12 08:04:22'),
(433, 16, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-12 08:04:40'),
(434, 10, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-12 08:24:02'),
(435, 9, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-12 08:28:07'),
(436, 12, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-13 18:40:50'),
(437, 14, 8, 'destroyer sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-15 07:55:34'),
(438, 8, 14, 'pufpuf accepted your friend request', 'system', 'unread', NULL, NULL, '2025-12-15 08:54:58'),
(439, 4, 14, 'pufpuf sent you a friend request', 'invite', 'unread', NULL, NULL, '2025-12-21 13:18:28'),
(440, 14, 4, 'lenovo accepted your friend request', 'system', 'unread', NULL, NULL, '2025-12-21 13:18:51'),
(441, 4, NULL, 'Test notification from lenovo at 2:54:11 AM', 'system', 'unread', NULL, NULL, '2025-12-22 13:54:11'),
(442, 14, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with ₦1,000.00 stake! Match scheduled for: Dec 23, 5:15 am', 'invite', 'unread', 62, NULL, '2025-12-22 15:14:46'),
(443, 4, 14, 'pufpuf has challenged you to a Call of Duty: Warzone match with 2083 XP stake!', 'match', 'unread', 69, NULL, '2025-12-23 21:37:21'),
(444, 14, 4, 'lenovo has challenged you to a Call of Duty: Warzone match with 32 XP stake!', 'match', 'unread', 70, NULL, '2025-12-25 11:50:44'),
(445, 4, 14, 'pufpuf challenged you to a Call of Duty: Mobile match with 4973 XP stake!', '', 'unread', 72, NULL, '2025-12-26 11:15:57'),
(446, 14, 4, 'lenovo accepted your match invitation!', '', 'unread', 72, NULL, '2025-12-26 12:07:49'),
(447, 14, 4, 'lenovo submitted match results', '', 'unread', 72, NULL, '2025-12-26 12:11:49'),
(448, 8, 14, 'pufpuf challenged you to a Free Fire match with 2973 XP stake!', '', 'unread', 73, NULL, '2025-12-26 12:17:31'),
(449, 14, 8, 'destroyer accepted your match invitation!', '', 'unread', 73, NULL, '2025-12-26 12:31:31'),
(450, 8, 14, 'pufpuf challenged you to a Call of Duty: Mobile match with 2083 XP stake!', '', 'unread', 74, NULL, '2025-12-27 08:55:19'),
(451, 14, 8, 'destroyer accepted your match invitation!', '', 'unread', 74, NULL, '2025-12-27 09:36:44'),
(452, 14, 8, 'destroyer submitted match results. Please submit yours.', '', 'unread', 74, NULL, '2025-12-27 09:36:57'),
(453, 14, 14, 'Both players agreed on winner! Winner: destroyer', 'match', 'unread', 74, NULL, '2025-12-27 09:37:29'),
(454, 8, 12, 'kratos challenged you to a Call of Duty: Mobile match with ₦30000 stake!', '', 'unread', 76, NULL, '2025-12-27 10:41:56'),
(455, 12, 8, 'destroyer accepted your match invitation!', '', 'unread', 76, NULL, '2025-12-27 10:42:54'),
(456, 8, 12, 'kratos submitted match results. Please submit yours.', '', 'unread', 76, NULL, '2025-12-27 10:46:10'),
(457, 12, NULL, '🎉 You won the match! Prize: ₦29750.00', '', 'unread', 76, NULL, '2025-12-27 10:47:09'),
(458, 8, NULL, 'Match completed. Winner: kratos', '', 'unread', 76, NULL, '2025-12-27 10:47:09'),
(459, 12, 8, 'destroyer challenged you to a Call of Duty: Warzone match with ₦20200 stake!', '', 'unread', 77, NULL, '2025-12-29 10:07:15'),
(460, 8, 12, 'kratos accepted your match invitation!', '', 'unread', 77, NULL, '2025-12-29 10:09:09'),
(461, 8, 12, 'kratos submitted match results. Please submit yours.', '', 'unread', 77, NULL, '2025-12-29 10:09:53'),
(462, 8, NULL, '🎉 You won the match!', '', 'unread', 77, NULL, '2025-12-29 10:10:28'),
(463, 12, NULL, 'Match completed. Winner: destroyer', '', 'unread', 77, NULL, '2025-12-29 10:10:28'),
(464, 14, 8, 'destroyer challenged you to a Call of Duty: Mobile match with ₦20000 stake!', '', 'unread', 78, NULL, '2025-12-29 10:46:40'),
(465, 8, 14, 'pufpuf accepted your match invitation!', '', 'unread', 78, NULL, '2025-12-29 10:47:37'),
(466, 8, 14, 'pufpuf submitted match results. Please submit yours.', '', 'unread', 78, NULL, '2025-12-29 10:47:51'),
(467, 8, NULL, '🎉 You won the match!', '', 'unread', 78, NULL, '2025-12-29 10:48:19'),
(468, 14, NULL, 'Match completed. Winner: destroyer', '', 'unread', 78, NULL, '2025-12-29 10:48:19'),
(469, 12, 8, 'destroyer challenged you to a Call of Duty: Warzone match with ₦20000 stake!', '', 'unread', 79, NULL, '2025-12-29 17:14:48'),
(470, 8, 12, 'kratos accepted your match invitation!', '', 'unread', 79, NULL, '2025-12-29 17:16:59'),
(471, 8, 12, 'kratos submitted match results. Please submit yours.', '', 'unread', 79, NULL, '2025-12-29 17:17:08'),
(472, 12, NULL, '🎉 You won the match!', '', 'unread', 79, NULL, '2025-12-29 17:17:38'),
(473, 8, NULL, 'Match completed. Winner: kratos', '', 'unread', 79, NULL, '2025-12-29 17:17:38'),
(474, 4, 12, 'kratos challenged you to a Call of Duty: Mobile match with ₦20000 stake!', '', 'unread', 80, NULL, '2025-12-29 17:19:35'),
(475, 16, 12, 'kratos challenged you to a Call of Duty: Mobile match with ₦14800 stake!', '', 'unread', 81, NULL, '2025-12-29 17:27:53'),
(476, 12, 16, 'plaything accepted your match invitation!', '', 'unread', 81, NULL, '2025-12-29 17:29:20'),
(477, 12, 16, 'plaything submitted match results. Please submit yours.', '', 'unread', 81, NULL, '2025-12-29 17:29:33'),
(478, 12, NULL, '🎉 You won the match!', '', 'unread', 81, NULL, '2025-12-29 17:29:59'),
(479, 16, NULL, 'Match completed. Winner: kratos', '', 'unread', 81, NULL, '2025-12-29 17:29:59'),
(480, 16, 12, 'kratos challenged you to a Call of Duty: Warzone match with ₦9800 stake!', '', 'unread', 82, NULL, '2025-12-29 17:40:18'),
(481, 16, 12, 'kratos challenged you to a Call of Duty: Mobile match with ₦4800 stake!', '', 'unread', 83, NULL, '2025-12-29 23:47:21'),
(482, 12, 16, 'plaything accepted your match invitation!', '', 'unread', 83, NULL, '2025-12-29 23:49:03'),
(483, 12, 16, 'plaything submitted match results. Please submit yours.', '', 'unread', 83, NULL, '2025-12-29 23:56:48'),
(484, 12, NULL, '🎉 You won the match!', '', 'unread', 83, NULL, '2025-12-29 23:57:30'),
(485, 16, NULL, 'Match completed. Winner: kratos', '', 'unread', 83, NULL, '2025-12-29 23:57:30'),
(486, 14, 8, 'destroyer joined your match!', '', 'unread', 71, NULL, '2025-12-30 10:22:29'),
(487, 8, 12, 'kratos joined your match!', '', 'unread', 84, NULL, '2025-12-30 10:28:24'),
(488, 8, 12, 'kratos accepted your friend request', 'system', 'unread', NULL, NULL, '2025-12-30 10:32:57'),
(489, 16, 8, 'destroyer challenged you to a Call of Duty: Warzone match with ₦4800 stake!', '', 'unread', 85, NULL, '2025-12-30 21:17:31'),
(490, 8, 16, 'plaything accepted your match invitation!', '', 'unread', 85, NULL, '2025-12-30 21:20:03'),
(491, 8, 16, 'plaything submitted match results. Please submit yours.', '', 'unread', 85, NULL, '2025-12-30 21:20:16'),
(492, 8, NULL, '🎉 You won the match!', '', 'unread', 85, NULL, '2025-12-30 21:20:59'),
(493, 16, NULL, 'Match completed. Winner: destroyer', '', 'unread', 85, NULL, '2025-12-30 21:20:59'),
(494, 8, 12, 'kratos submitted match results. Please submit yours.', '', 'unread', 84, NULL, '2026-01-03 19:49:50'),
(495, 8, 8, 'Players disagree on winner. Match disputed and sent to admin.', '', 'unread', 84, NULL, '2026-01-03 19:50:06'),
(496, 12, 8, 'Players disagree on winner. Match disputed and sent to admin.', '', 'unread', 84, NULL, '2026-01-03 19:50:06'),
(497, 8, 8, 'Your tournament \"conquer\" has been created successfully!', 'tournament', 'unread', NULL, 98, '2026-01-06 05:52:47'),
(498, 9, 8, 'Your group has been registered in tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 05:52:47'),
(499, 3, NULL, 'Your group has joined tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 06:17:04'),
(500, 12, NULL, 'Your group has joined tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 06:17:04'),
(501, 13, NULL, 'Your group has joined tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 06:17:04'),
(502, 8, NULL, 'leinado has joined your tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 06:17:04'),
(503, 15, 18, 'potex has requested to join your group \"undefined\"', '', 'unread', NULL, NULL, '2026-01-06 06:58:14'),
(504, 14, 18, 'potex has joined your group gadus', 'system', 'unread', NULL, NULL, '2026-01-06 07:03:08'),
(505, 1, 18, 'potex has joined your group phoenix squad', 'system', 'unread', NULL, NULL, '2026-01-06 07:04:11'),
(506, 1, NULL, 'Your group has joined tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 15:26:12'),
(507, 7, NULL, 'Your group has joined tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 15:26:12'),
(508, 10, NULL, 'Your group has joined tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 15:26:12'),
(509, 8, NULL, 'lenovo has joined your tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 15:26:12'),
(510, 8, NULL, 'gradust has joined your tournament \"conquer\"', 'tournament', 'unread', NULL, 98, '2026-01-06 15:38:36'),
(511, 1, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:26'),
(512, 3, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:26'),
(513, 4, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:26'),
(514, 7, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:26'),
(515, 8, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(516, 9, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(517, 10, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(518, 11, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(519, 12, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(520, 13, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(521, 15, NULL, 'Tournament \'conquer\' has started! Check your matches.', 'system', 'unread', NULL, 98, '2026-01-06 16:19:27'),
(522, 1, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(523, 3, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(524, 4, NULL, '🏆 Congratulations! You won the tournament \"conquer\" and earned 1700.00 XP!', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(525, 7, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(526, 8, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(527, 9, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(528, 10, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(529, 11, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(530, 12, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(531, 13, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(532, 15, NULL, '🏁 Tournament \"conquer\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 98, '2026-01-06 18:41:01'),
(533, 3, 3, 'Your tournament \"survive\" has been created successfully!', 'tournament', 'unread', NULL, 99, '2026-01-07 04:44:15'),
(534, 3, 3, 'Your tournament \"survive\" has been created successfully!', 'tournament', 'unread', NULL, 100, '2026-01-07 05:01:59'),
(535, 3, NULL, 'gradust has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 100, '2026-01-07 05:02:28'),
(536, 3, NULL, 'kratos has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 100, '2026-01-07 05:02:57'),
(537, 3, NULL, 'destroyer has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 100, '2026-01-07 05:03:10'),
(538, 3, NULL, 'plaything has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 100, '2026-01-07 05:03:46'),
(539, 3, NULL, 'lenovo has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 100, '2026-01-07 05:04:06'),
(540, 3, NULL, 'tomatoe has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 100, '2026-01-07 05:05:42'),
(541, 3, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(542, 4, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(543, 6, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(544, 8, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(545, 12, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(546, 15, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(547, 16, NULL, 'Tournament \'survive\' has started! Check your matches.', 'system', 'unread', NULL, 100, '2026-01-07 05:17:50'),
(548, 3, NULL, '🏁 Tournament \"survive\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(549, 4, NULL, '🏁 Tournament \"survive\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(550, 6, NULL, '🏁 Tournament \"survive\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(551, 8, NULL, '🏆 Congratulations! You won the tournament \"survive\" and earned 7208.00 XP!', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(552, 12, NULL, '🏁 Tournament \"survive\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(553, 15, NULL, '🏁 Tournament \"survive\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(554, 16, NULL, '🏁 Tournament \"survive\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 100, '2026-01-07 05:18:35'),
(555, 8, 8, 'Your tournament \"winners\" has been created successfully!', 'tournament', 'unread', NULL, 101, '2026-01-07 05:21:07'),
(556, 15, 15, 'Your tournament \"survive\" has been created successfully!', 'tournament', 'unread', NULL, 102, '2026-01-07 18:36:21'),
(557, 3, 3, 'Your tournament \"survivor\" has been created successfully!', 'tournament', 'unread', NULL, 103, '2026-01-08 17:32:42'),
(558, 3, NULL, 'destroyer has joined your tournament \"survivor\"', 'tournament', 'unread', NULL, 103, '2026-01-08 17:34:07'),
(559, 3, NULL, 'mystic has joined your tournament \"survivor\"', 'tournament', 'unread', NULL, 103, '2026-01-08 17:34:18'),
(560, 3, NULL, 'plaything has joined your tournament \"survivor\"', 'tournament', 'unread', NULL, 103, '2026-01-08 17:34:37'),
(561, 3, NULL, 'Tournament \'survivor\' has started! Check your matches.', 'system', 'unread', NULL, 103, '2026-01-08 17:42:37'),
(562, 8, NULL, 'Tournament \'survivor\' has started! Check your matches.', 'system', 'unread', NULL, 103, '2026-01-08 17:42:37'),
(563, 9, NULL, 'Tournament \'survivor\' has started! Check your matches.', 'system', 'unread', NULL, 103, '2026-01-08 17:42:37'),
(564, 16, NULL, 'Tournament \'survivor\' has started! Check your matches.', 'system', 'unread', NULL, 103, '2026-01-08 17:42:37'),
(565, 3, NULL, '🏁 Tournament \"survivor\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 103, '2026-01-08 17:54:48'),
(566, 8, NULL, '🏆 Congratulations! You won the tournament \"survivor\" and earned 909.50 XP!', 'tournament', 'unread', NULL, 103, '2026-01-08 17:54:48'),
(567, 9, NULL, '🏁 Tournament \"survivor\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 103, '2026-01-08 17:54:48'),
(568, 16, NULL, '🏁 Tournament \"survivor\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 103, '2026-01-08 17:54:48'),
(569, 1, NULL, 'Your group has joined tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:13:16'),
(570, 7, NULL, 'Your group has joined tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:13:16'),
(571, 10, NULL, 'Your group has joined tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:13:16'),
(572, 15, NULL, 'lenovo has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:13:16'),
(573, 8, NULL, 'Your group has joined tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:18:09'),
(574, 18, NULL, 'Your group has joined tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:18:09'),
(575, 15, NULL, 'pufpuf has joined your tournament \"survive\"', 'tournament', 'unread', NULL, 102, '2026-01-09 00:18:09'),
(576, 8, 9, 'mystic accepted your friend request', 'system', 'unread', NULL, NULL, '2026-01-09 00:34:20'),
(577, 8, 8, 'Your tournament \"last man standing\" has been created successfully!', 'tournament', 'unread', NULL, 104, '2026-01-10 01:19:06'),
(578, 8, NULL, 'kratos has joined your tournament \"last man standing\"', 'tournament', 'unread', NULL, 104, '2026-01-10 03:53:12'),
(579, 8, NULL, 'plaything has joined your tournament \"last man standing\"', 'tournament', 'unread', NULL, 104, '2026-01-10 03:54:56'),
(580, 8, NULL, 'gradust has joined your tournament \"last man standing\"', 'tournament', 'unread', NULL, 104, '2026-01-10 03:55:25'),
(581, 8, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 03:58:10'),
(582, 12, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 03:58:10'),
(583, 15, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 03:58:10'),
(584, 16, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 03:58:10'),
(585, 8, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 07:42:22'),
(586, 12, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 07:42:22'),
(587, 15, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 07:42:22'),
(588, 16, NULL, 'Tournament \'last man standing\' has started! Check your matches.', 'system', 'unread', NULL, 104, '2026-01-10 07:42:23'),
(589, 16, 8, 'You won your match in tournament!', 'system', 'unread', 26, 104, '2026-01-10 07:58:34'),
(590, 8, 8, 'Match result submitted for tournament.', 'system', 'unread', 26, 104, '2026-01-10 07:58:34'),
(591, 12, 12, 'You won your match in tournament!', 'system', 'unread', 25, 104, '2026-01-10 08:13:19'),
(592, 15, 12, 'Match result submitted for tournament.', 'system', 'unread', 25, 104, '2026-01-10 08:13:19'),
(593, 8, 8, 'Your tournament \"conquer 2\" has been created successfully!', 'tournament', 'unread', NULL, 105, '2026-01-10 09:43:56'),
(594, 8, 8, 'Your tournament \"conquer 3\" has been created successfully!', 'tournament', 'unread', NULL, 106, '2026-01-10 09:45:55'),
(595, 8, NULL, 'mystic has joined your tournament \"conquer 3\"', 'tournament', 'unread', NULL, 106, '2026-01-10 09:46:35'),
(596, 8, NULL, 'kratos has joined your tournament \"conquer 3\"', 'tournament', 'unread', NULL, 106, '2026-01-10 09:46:49'),
(597, 8, NULL, 'plaything has joined your tournament \"conquer 3\"', 'tournament', 'unread', NULL, 106, '2026-01-10 09:47:00'),
(598, 8, NULL, 'Tournament \'conquer 3\' has started! Check your matches.', 'system', 'unread', NULL, 106, '2026-01-10 09:47:36'),
(599, 9, NULL, 'Tournament \'conquer 3\' has started! Check your matches.', 'system', 'unread', NULL, 106, '2026-01-10 09:47:36'),
(600, 12, NULL, 'Tournament \'conquer 3\' has started! Check your matches.', 'system', 'unread', NULL, 106, '2026-01-10 09:47:36'),
(601, 16, NULL, 'Tournament \'conquer 3\' has started! Check your matches.', 'system', 'unread', NULL, 106, '2026-01-10 09:47:36'),
(602, 8, 8, 'You won your match in tournament!', 'system', 'unread', 28, 106, '2026-01-10 09:48:00'),
(603, 16, 8, 'Match result submitted for tournament.', 'system', 'unread', 28, 106, '2026-01-10 09:48:00'),
(604, 9, 9, 'You won your match in tournament!', 'system', 'unread', 29, 106, '2026-01-10 09:48:31'),
(605, 12, 9, 'Match result submitted for tournament.', 'system', 'unread', 29, 106, '2026-01-10 09:48:31'),
(606, 8, 8, 'Your tournament \"conquer 4\" has been created successfully!', 'tournament', 'unread', NULL, 107, '2026-01-10 20:00:45'),
(607, 8, NULL, 'flawless has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:04:14'),
(608, 8, NULL, 'gradust has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:04:55'),
(609, 8, NULL, 'kratos has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:05:09'),
(610, 8, NULL, 'lenovo has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:05:27'),
(611, 8, NULL, 'mystic has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:05:54'),
(612, 8, NULL, 'natest be disoo has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:06:15'),
(613, 8, NULL, 'plaything has joined your tournament \"conquer 4\"', 'tournament', 'unread', NULL, 107, '2026-01-10 20:06:36'),
(614, 4, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(615, 8, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(616, 9, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(617, 10, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(618, 12, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(619, 15, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(620, 16, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(621, 17, NULL, 'Tournament \'conquer 4\' has started! Check your matches.', 'system', 'unread', NULL, 107, '2026-01-10 20:07:33'),
(622, 8, 8, 'You won your match in tournament conquer 4!', 'system', 'unread', 34, 107, '2026-01-10 20:07:46'),
(623, 4, 8, 'Match result submitted for tournament conquer 4.', 'system', 'unread', 34, 107, '2026-01-10 20:07:46'),
(624, 12, 12, 'You won your match in tournament conquer 4!', 'system', 'unread', 31, 107, '2026-01-10 20:08:40'),
(625, 15, 12, 'Match result submitted for tournament conquer 4.', 'system', 'unread', 31, 107, '2026-01-10 20:08:40'),
(626, 17, 17, 'You won your match in tournament conquer 4!', 'system', 'unread', 33, 107, '2026-01-10 20:09:09'),
(627, 10, 17, 'Match result submitted for tournament conquer 4.', 'system', 'unread', 33, 107, '2026-01-10 20:09:09'),
(628, 9, 9, 'You won your match in tournament conquer 4!', 'system', 'unread', 32, 107, '2026-01-10 20:10:53'),
(629, 16, 9, 'Match result submitted for tournament conquer 4.', 'system', 'unread', 32, 107, '2026-01-10 20:10:53'),
(630, 12, 9, 'You won your match against mystic in tournament conquer 4!', 'system', 'unread', 35, 107, '2026-01-12 05:30:27'),
(631, 9, 9, 'Match result submitted: You lost to kratos in tournament conquer 4.', 'system', 'unread', 35, 107, '2026-01-12 05:30:27'),
(632, 8, 8, 'You won your match against natest be disoo in tournament conquer 4!', 'system', 'unread', 36, 107, '2026-01-12 05:30:59'),
(633, 17, 8, 'Match result submitted: You lost to destroyer in tournament conquer 4.', 'system', 'unread', 36, 107, '2026-01-12 05:30:59'),
(634, 8, 8, 'Your tournament \"conquer 5\" has been created successfully!', 'tournament', 'unread', NULL, 108, '2026-01-12 05:47:42'),
(635, 8, NULL, 'flawless has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:50:08'),
(636, 8, NULL, 'gradust has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:50:23'),
(637, 8, NULL, 'kratos has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:50:39'),
(638, 8, NULL, 'lenovo has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:52:00'),
(639, 8, NULL, 'mystic has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:52:16'),
(640, 8, NULL, 'natest be disoo has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:52:58'),
(641, 8, NULL, 'plaything has joined your tournament \"conquer 5\"', 'tournament', 'unread', NULL, 108, '2026-01-12 05:53:38'),
(642, 4, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(643, 8, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(644, 9, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(645, 10, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(646, 12, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(647, 15, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(648, 16, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(649, 17, NULL, 'Tournament \'conquer 5\' has started! Check your matches.', 'system', 'unread', NULL, 108, '2026-01-12 05:55:47'),
(650, 16, 16, 'You won your match against natest be disoo in tournament conquer 5!', 'system', 'unread', 37, 108, '2026-01-12 05:57:17'),
(651, 17, 16, 'Match result submitted: You lost to plaything in tournament conquer 5.', 'system', 'unread', 37, 108, '2026-01-12 05:57:17'),
(652, 10, 10, 'You won your match against gradust in tournament conquer 5!', 'system', 'unread', 38, 108, '2026-01-12 05:57:46'),
(653, 15, 10, 'Match result submitted: You lost to flawless in tournament conquer 5.', 'system', 'unread', 38, 108, '2026-01-12 05:57:46'),
(654, 4, 4, 'You won your match against mystic in tournament conquer 5!', 'system', 'unread', 39, 108, '2026-01-12 05:58:08'),
(655, 9, 4, 'Match result submitted: You lost to lenovo in tournament conquer 5.', 'system', 'unread', 39, 108, '2026-01-12 05:58:08'),
(656, 12, 12, 'You won your match against destroyer in tournament conquer 5!', 'system', 'unread', 40, 108, '2026-01-12 05:58:51'),
(657, 8, 12, 'Match result submitted: You lost to kratos in tournament conquer 5.', 'system', 'unread', 40, 108, '2026-01-12 05:58:51'),
(658, 12, 12, 'You won your match against lenovo in tournament conquer 5!', 'system', 'unread', 42, 108, '2026-01-12 06:08:29'),
(659, 4, 12, 'Match result submitted: You lost to kratos in tournament conquer 5.', 'system', 'unread', 42, 108, '2026-01-12 06:08:29'),
(660, 16, 16, 'You won your match against flawless in tournament conquer 5!', 'system', 'unread', 41, 108, '2026-01-12 06:09:16'),
(661, 10, 16, 'Match result submitted: You lost to plaything in tournament conquer 5.', 'system', 'unread', 41, 108, '2026-01-12 06:09:16'),
(662, 8, 8, 'Your tournament \"conquer 6\" has been created successfully!', 'tournament', 'unread', NULL, 109, '2026-01-12 06:21:56'),
(663, 8, NULL, 'flawless has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:22:30'),
(664, 8, NULL, 'gradust has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:22:44'),
(665, 8, NULL, 'kratos has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:23:03'),
(666, 8, NULL, 'lenovo has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:23:16'),
(667, 8, NULL, 'mystic has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:23:28'),
(668, 8, NULL, 'plaything has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:23:56'),
(669, 8, NULL, 'tomatoe has joined your tournament \"conquer 6\"', 'tournament', 'unread', NULL, 109, '2026-01-12 06:24:09'),
(670, 4, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:32'),
(671, 6, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:32'),
(672, 8, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:33'),
(673, 9, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:33'),
(674, 10, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:33'),
(675, 12, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:33'),
(676, 15, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:33'),
(677, 16, NULL, 'Tournament \'conquer 6\' has started! Check your matches.', 'system', 'unread', NULL, 109, '2026-01-12 06:24:33'),
(678, 9, 8, 'You won your match against destroyer in tournament conquer 6!', 'system', 'unread', 44, 109, '2026-01-12 06:24:50'),
(679, 8, 8, 'Match result submitted: You lost to mystic in tournament conquer 6.', 'system', 'unread', 44, 109, '2026-01-12 06:24:50'),
(680, 6, 6, 'You won your match against lenovo in tournament conquer 6!', 'system', 'unread', 45, 109, '2026-01-12 06:27:27'),
(681, 4, 6, 'Match result submitted: You lost to tomatoe in tournament conquer 6.', 'system', 'unread', 45, 109, '2026-01-12 06:27:27'),
(682, 16, 16, 'You won your match against kratos in tournament conquer 6!', 'system', 'unread', 43, 109, '2026-01-12 06:47:39'),
(683, 12, 16, 'Match result submitted: You lost to plaything in tournament conquer 6.', 'system', 'unread', 43, 109, '2026-01-12 06:47:39'),
(684, 10, 10, 'You won your match against gradust in tournament conquer 6!', 'system', 'unread', 46, 109, '2026-01-12 06:55:21'),
(685, 15, 10, 'Match result submitted: You lost to flawless in tournament conquer 6.', 'system', 'unread', 46, 109, '2026-01-12 06:55:21'),
(686, 10, 10, 'You won your match against plaything in tournament conquer 6!', 'system', 'unread', 48, 109, '2026-01-12 07:01:48'),
(687, 16, 10, 'Match result submitted: You lost to flawless in tournament conquer 6.', 'system', 'unread', 48, 109, '2026-01-12 07:01:48'),
(688, 9, 9, 'You won your match against tomatoe in tournament conquer 6!', 'system', 'unread', 47, 109, '2026-01-12 07:05:56'),
(689, 6, 9, 'Match result submitted: You lost to mystic in tournament conquer 6.', 'system', 'unread', 47, 109, '2026-01-12 07:05:56'),
(690, 8, 8, 'You won your match against tomatoe in tournament conquer 6!', 'system', 'unread', 50, 109, '2026-01-12 07:12:20'),
(691, 6, 8, 'Match result submitted: You lost to destroyer in tournament conquer 6.', 'system', 'unread', 50, 109, '2026-01-12 07:12:20'),
(692, 9, 9, 'You won your match against gradust in tournament conquer 6!', 'system', 'unread', 51, 109, '2026-01-12 07:13:12'),
(693, 15, 9, 'Match result submitted: You lost to mystic in tournament conquer 6.', 'system', 'unread', 51, 109, '2026-01-12 07:13:12'),
(694, 9, 9, 'You won your match against destroyer in tournament conquer 6!', 'system', 'unread', 52, 109, '2026-01-12 07:13:21'),
(695, 8, 9, 'Match result submitted: You lost to mystic in tournament conquer 6.', 'system', 'unread', 52, 109, '2026-01-12 07:13:21'),
(696, 4, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(697, 6, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(698, 8, NULL, '🏆 Congratulations! You won the tournament \"conquer 6\" and earned 688.50 XP!', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(699, 9, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(700, 10, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(701, 12, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(702, 15, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(703, 16, NULL, '🏁 Tournament \"conquer 6\" has been completed. Winner: destroyer', 'tournament', 'unread', NULL, 109, '2026-01-12 07:43:52'),
(704, 8, 8, 'Your tournament \"conquer 7\" has been created successfully!', 'tournament', 'unread', NULL, 110, '2026-01-12 07:44:46'),
(705, 8, NULL, 'flawless has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:45:02'),
(706, 8, NULL, 'gradust has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:45:17'),
(707, 8, NULL, 'kratos has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:46:39'),
(708, 8, NULL, 'tomatoe has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:47:31'),
(709, 8, NULL, 'natest be disoo has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:47:44'),
(710, 8, NULL, 'plaything has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:48:08'),
(711, 8, NULL, 'lenovo has joined your tournament \"conquer 7\"', 'tournament', 'unread', NULL, 110, '2026-01-12 07:48:33'),
(712, 4, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:20'),
(713, 6, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:20'),
(714, 8, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:20'),
(715, 10, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:20'),
(716, 12, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:20'),
(717, 15, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:20'),
(718, 16, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:21'),
(719, 17, NULL, 'Tournament \'conquer 7\' has started! Check your matches.', 'system', 'unread', NULL, 110, '2026-01-12 07:49:21'),
(720, 4, 8, 'You won your match against destroyer in tournament conquer 7!', 'system', 'unread', 53, 110, '2026-01-12 07:50:08'),
(721, 8, 8, 'Match result submitted: You lost to lenovo in tournament conquer 7.', 'system', 'unread', 53, 110, '2026-01-12 07:50:08'),
(722, 16, 16, 'You won your match against natest be disoo in tournament conquer 7!', 'system', 'unread', 54, 110, '2026-01-12 07:50:36'),
(723, 17, 16, 'Match result submitted: You lost to plaything in tournament conquer 7.', 'system', 'unread', 54, 110, '2026-01-12 07:50:36'),
(724, 12, 12, 'You won your match against gradust in tournament conquer 7!', 'system', 'unread', 55, 110, '2026-01-12 07:50:59'),
(725, 15, 12, 'Match result submitted: You lost to kratos in tournament conquer 7.', 'system', 'unread', 55, 110, '2026-01-12 07:50:59'),
(726, 10, 6, 'You won your match against tomatoe in tournament conquer 7!', 'system', 'unread', 56, 110, '2026-01-12 07:51:32'),
(727, 6, 6, 'Match result submitted: You lost to flawless in tournament conquer 7.', 'system', 'unread', 56, 110, '2026-01-12 07:51:32'),
(728, 12, 10, 'You won your match against flawless in tournament conquer 7!', 'system', 'unread', 58, 110, '2026-01-12 07:51:59'),
(729, 10, 10, 'Match result submitted: You lost to kratos in tournament conquer 7.', 'system', 'unread', 58, 110, '2026-01-12 07:51:59'),
(730, 4, 4, 'You won your match against plaything in tournament conquer 7!', 'system', 'unread', 57, 110, '2026-01-12 07:52:37'),
(731, 16, 4, 'Match result submitted: You lost to lenovo in tournament conquer 7.', 'system', 'unread', 57, 110, '2026-01-12 07:52:37'),
(732, 4, 4, 'You won your match against kratos in tournament conquer 7!', 'system', 'unread', 59, 110, '2026-01-12 07:52:46'),
(733, 12, 4, 'Match result submitted: You lost to lenovo in tournament conquer 7.', 'system', 'unread', 59, 110, '2026-01-12 07:52:46'),
(734, 4, NULL, '🏆 Congratulations! You won the tournament \"conquer 7\" and earned 697.00 XP!', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(735, 6, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(736, 8, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(737, 10, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(738, 12, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36');
INSERT INTO `notifications` (`id`, `user_id`, `sender_id`, `message`, `type`, `status`, `match_id`, `tournament_id`, `created_at`) VALUES
(739, 15, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(740, 16, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(741, 17, NULL, '🏁 Tournament \"conquer 7\" has been completed. Winner: lenovo', 'tournament', 'unread', NULL, 110, '2026-01-12 07:53:36'),
(742, 8, 8, 'Your tournament \"conquer 8\" has been created successfully!', 'tournament', 'unread', NULL, 111, '2026-01-12 07:55:06'),
(743, 8, NULL, 'tomatoe has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:55:45'),
(744, 8, NULL, 'natest be disoo has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:56:18'),
(745, 8, NULL, 'plaything has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:56:31'),
(746, 8, NULL, 'mystic has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:56:56'),
(747, 8, NULL, 'lenovo has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:57:33'),
(748, 8, NULL, 'kratos has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:57:57'),
(749, 8, NULL, 'gradust has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:58:12'),
(750, 8, NULL, 'flawless has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:58:24'),
(751, 8, NULL, 'admin has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:59:02'),
(752, 8, NULL, 'pufpuf has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 07:59:49'),
(753, 8, NULL, 'danex has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 08:02:14'),
(754, 8, NULL, 'phid has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 08:04:17'),
(755, 8, NULL, 'philip has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 08:05:18'),
(756, 8, NULL, 'leinado has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 08:05:56'),
(757, 8, NULL, 'potex has joined your tournament \"conquer 8\"', 'tournament', 'unread', NULL, 111, '2026-01-12 08:06:57'),
(758, 1, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(759, 3, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(760, 4, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(761, 5, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(762, 6, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(763, 7, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(764, 8, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(765, 9, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(766, 10, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(767, 11, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(768, 12, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(769, 14, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(770, 15, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(771, 16, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(772, 17, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28'),
(773, 18, NULL, 'Tournament \'conquer 8\' has started! Check your matches.', 'system', 'unread', NULL, 111, '2026-01-12 08:07:28');

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

--
-- Dumping data for table `one_vs_one_match`
--

INSERT INTO `one_vs_one_match` (`id`, `tournament_id`, `round_number`, `match_order`, `player1_id`, `player2_id`, `winner_id`, `player1_score`, `player2_score`, `match_time`, `status`, `created_at`, `updated_at`) VALUES
(1, 63, 1, 1, 1, 12, 1, 10, 5, '2025-10-06 12:18:36', 'completed', '2025-10-06 09:18:36', '2025-10-06 10:24:37'),
(2, 63, 1, 2, 4, 8, 4, 20, 15, '2025-10-06 12:18:36', 'completed', '2025-10-06 09:18:36', '2025-10-06 10:53:06'),
(3, 64, 1, 1, 4, 12, 4, 20, 15, '2025-10-06 14:14:02', 'completed', '2025-10-06 11:14:02', '2025-10-06 11:14:50'),
(4, 64, 1, 2, 14, 1, 1, 15, 20, '2025-10-06 14:14:02', 'completed', '2025-10-06 11:14:02', '2025-10-06 11:15:14'),
(5, 64, 2, 1, 4, NULL, 4, NULL, NULL, '2025-10-06 15:15:14', 'completed', '2025-10-06 11:15:14', '2025-10-06 11:15:14'),
(6, 63, 2, 1, 1, 4, 4, 20, 25, '2025-10-06 19:26:09', 'completed', '2025-10-06 15:26:09', '2025-10-06 15:31:44'),
(7, 65, 1, 1, 12, 1, 12, 25, 20, '2025-10-06 18:46:02', 'completed', '2025-10-06 15:46:02', '2025-10-06 15:46:40'),
(8, 65, 1, 2, 9, 8, 8, 15, 20, '2025-10-06 18:46:02', 'completed', '2025-10-06 15:46:03', '2025-10-06 15:47:22'),
(9, 65, 2, 1, 12, 8, 12, 20, 15, '2025-10-06 20:19:06', 'completed', '2025-10-06 16:19:06', '2025-10-06 16:21:21'),
(10, 66, 1, 1, 8, 1, 8, 26, 20, '2025-10-06 19:34:33', 'completed', '2025-10-06 16:34:33', '2025-10-06 16:35:57'),
(11, 66, 1, 2, 9, 4, 9, 20, 15, '2025-10-06 19:34:33', 'completed', '2025-10-06 16:34:33', '2025-10-06 16:35:24'),
(12, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:24', 'upcoming', '2025-10-06 16:56:24', '2025-10-06 16:56:24'),
(13, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:28', 'upcoming', '2025-10-06 16:56:28', '2025-10-06 16:56:28'),
(14, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:32', 'upcoming', '2025-10-06 16:56:32', '2025-10-06 16:56:32'),
(15, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:35', 'upcoming', '2025-10-06 16:56:35', '2025-10-06 16:56:35'),
(16, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:38', 'upcoming', '2025-10-06 16:56:38', '2025-10-06 16:56:38'),
(17, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:42', 'upcoming', '2025-10-06 16:56:42', '2025-10-06 16:56:42'),
(18, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:45', 'upcoming', '2025-10-06 16:56:45', '2025-10-06 16:56:45'),
(19, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:49', 'upcoming', '2025-10-06 16:56:49', '2025-10-06 16:56:49'),
(20, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:52', 'upcoming', '2025-10-06 16:56:52', '2025-10-06 16:56:52'),
(21, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:56', 'upcoming', '2025-10-06 16:56:56', '2025-10-06 16:56:56'),
(22, 66, 2, 1, 8, 9, NULL, NULL, NULL, '2025-10-06 20:56:59', 'upcoming', '2025-10-06 16:56:59', '2025-10-06 16:56:59'),
(23, 67, 1, 1, 8, 1, 8, 20, 15, '2025-10-07 11:29:58', 'completed', '2025-10-07 08:29:58', '2025-10-07 08:30:41'),
(24, 67, 1, 2, 4, 16, 4, 15, 12, '2025-10-07 11:29:58', 'completed', '2025-10-07 08:29:58', '2025-10-07 08:31:13'),
(25, 67, 2, 1, 8, 4, 8, 23, 20, '2025-10-07 16:50:09', 'completed', '2025-10-07 12:50:09', '2025-10-07 12:50:59'),
(26, 68, 1, 1, 1, 4, 4, 15, 20, '2025-10-07 16:00:28', 'completed', '2025-10-07 13:00:28', '2025-10-07 13:01:12'),
(27, 68, 1, 2, 9, 8, 9, 25, 20, '2025-10-07 16:00:28', 'completed', '2025-10-07 13:00:28', '2025-10-07 13:01:34'),
(28, 68, 2, 1, 4, 9, 4, 16, 15, '2025-10-07 17:01:45', 'completed', '2025-10-07 13:01:45', '2025-10-07 13:02:16'),
(29, 69, 1, 1, 8, 1, 8, 20, 15, '2025-10-07 17:00:31', 'completed', '2025-10-07 14:00:31', '2025-10-07 14:01:08'),
(30, 69, 1, 2, 9, 4, 9, 25, 20, '2025-10-07 17:00:31', 'completed', '2025-10-07 14:00:31', '2025-10-07 14:01:32'),
(31, 69, 2, 1, 8, 9, 8, 20, 15, '2025-10-07 18:01:44', 'completed', '2025-10-07 14:01:44', '2025-10-07 14:02:13'),
(35, 70, 1, 1, 8, 1, 1, 25, 30, '2025-10-12 12:11:24', 'completed', '2025-10-12 09:11:24', '2025-10-12 09:12:38'),
(36, 70, 1, 2, 9, 4, 4, 50, 53, '2025-10-12 12:11:24', 'completed', '2025-10-12 09:11:24', '2025-10-12 09:13:04'),
(37, 62, 1, 1, 4, 12, 4, 20, 15, '2025-10-12 13:32:34', 'completed', '2025-10-12 10:32:34', '2025-10-12 10:33:38'),
(38, 62, 1, 2, 8, 1, 1, 15, 17, '2025-10-12 13:32:34', 'completed', '2025-10-12 10:32:34', '2025-10-12 10:34:06'),
(39, 62, 2, 1, 4, 1, 4, 17, 10, '2025-10-12 14:34:16', 'completed', '2025-10-12 10:34:16', '2025-10-12 10:34:43'),
(40, 71, 1, 1, 12, 1, 12, 20, 19, '2025-10-12 15:31:52', 'completed', '2025-10-12 12:31:52', '2025-10-12 12:32:38'),
(41, 71, 1, 2, 4, 9, 4, 17, 10, '2025-10-12 15:31:52', 'completed', '2025-10-12 12:31:52', '2025-10-12 12:33:01'),
(42, 71, 2, 1, 12, 4, 4, 17, 20, '2025-10-12 16:33:08', 'completed', '2025-10-12 12:33:08', '2025-10-12 12:33:33');

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

--
-- Dumping data for table `one_vs_one_matches`
--

INSERT INTO `one_vs_one_matches` (`id`, `tournament_id`, `round_number`, `match_order`, `player1_id`, `player2_id`, `winner_id`, `match_time`, `status`, `player1_score`, `player2_score`, `created_at`, `updated_at`) VALUES
(85, 58, 1, 1, 14, 7, NULL, '2025-10-05 13:04:07', 'upcoming', NULL, NULL, '2025-10-05 10:04:07', '2025-10-05 10:04:07'),
(86, 58, 1, 2, 8, 1, NULL, '2025-10-05 13:04:07', 'upcoming', NULL, NULL, '2025-10-05 10:04:07', '2025-10-05 10:04:07'),
(87, 58, 1, 3, 12, 4, NULL, '2025-10-05 13:04:07', 'upcoming', NULL, NULL, '2025-10-05 10:04:07', '2025-10-05 10:04:07'),
(88, 58, 1, 4, 9, 16, NULL, '2025-10-05 13:04:07', 'upcoming', NULL, NULL, '2025-10-05 10:04:07', '2025-10-05 10:04:07'),
(97, 57, 1, 1, 8, 4, NULL, '2025-10-05 13:50:15', 'upcoming', NULL, NULL, '2025-10-05 10:50:15', '2025-10-05 10:50:15'),
(98, 57, 1, 2, 1, 7, NULL, '2025-10-05 13:50:15', 'upcoming', NULL, NULL, '2025-10-05 10:50:15', '2025-10-05 10:50:15'),
(99, 57, 1, 3, 12, 16, NULL, '2025-10-05 13:50:15', 'upcoming', NULL, NULL, '2025-10-05 10:50:15', '2025-10-05 10:50:15'),
(100, 57, 1, 4, 14, 9, NULL, '2025-10-05 13:50:15', 'upcoming', NULL, NULL, '2025-10-05 10:50:15', '2025-10-05 10:50:15'),
(101, 59, 1, 1, 12, 8, NULL, '2025-10-05 21:28:16', 'upcoming', NULL, NULL, '2025-10-05 18:28:16', '2025-10-05 18:28:16'),
(102, 59, 1, 2, 4, 1, NULL, '2025-10-05 21:28:16', 'upcoming', NULL, NULL, '2025-10-05 18:28:16', '2025-10-05 18:28:16'),
(105, 60, 1, 1, 14, 4, NULL, '2025-10-05 23:21:17', 'upcoming', NULL, NULL, '2025-10-05 20:21:17', '2025-10-05 20:21:17'),
(106, 60, 1, 2, 16, 1, NULL, '2025-10-05 23:21:17', 'upcoming', NULL, NULL, '2025-10-05 20:21:17', '2025-10-05 20:21:17');

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

--
-- Dumping data for table `one_vs_one_tournament`
--

INSERT INTO `one_vs_one_tournament` (`id`, `tournament_id`, `bracket_generated`, `current_round`, `total_rounds`, `final_winner_id`, `created_at`, `updated_at`) VALUES
(1, 63, 1, 3, 2, NULL, '2025-10-06 09:13:20', '2025-11-10 07:59:52'),
(16, 60, 0, 1, 1, NULL, '2025-10-06 11:09:24', '2025-10-06 11:09:24'),
(17, 64, 1, 2, 2, NULL, '2025-10-06 11:11:07', '2025-10-06 15:34:06'),
(30, 65, 1, 2, 2, NULL, '2025-10-06 15:43:08', '2025-10-06 16:22:08'),
(43, 66, 1, 2, 2, NULL, '2025-10-06 16:32:24', '2025-11-10 08:09:15'),
(54, 67, 1, 2, 2, NULL, '2025-10-07 08:27:09', '2025-10-07 12:53:59'),
(67, 68, 1, 2, 2, NULL, '2025-10-07 12:57:35', '2025-10-07 13:09:57'),
(80, 69, 1, 2, 2, 8, '2025-10-07 13:56:37', '2025-10-08 20:49:45'),
(103, 70, 1, 1, 2, 4, '2025-10-11 20:22:34', '2025-10-12 12:27:31'),
(121, 62, 1, 2, 2, 4, '2025-10-12 10:32:22', '2025-10-12 12:27:06'),
(135, 71, 1, 2, 2, 4, '2025-10-12 12:29:32', '2025-10-13 11:20:00'),
(149, 61, 0, 1, 1, NULL, '2025-10-22 17:24:58', '2025-10-22 17:25:29'),
(158, 74, 0, 1, 1, NULL, '2025-10-28 14:06:08', '2025-10-31 15:13:06'),
(159, 77, 0, 1, 1, NULL, '2025-10-28 14:14:32', '2025-11-01 13:48:45'),
(165, 79, 0, 1, 1, NULL, '2025-10-31 15:18:43', '2025-11-01 13:59:29'),
(169, 82, 0, 1, 1, NULL, '2025-11-01 14:01:26', '2025-11-01 14:02:25'),
(172, 83, 0, 1, 1, NULL, '2025-11-01 14:05:24', '2025-11-10 06:59:34'),
(181, 57, 0, 1, 1, NULL, '2025-11-10 06:53:42', '2025-11-10 07:28:59');

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

--
-- Dumping data for table `one_vs_one_tournaments`
--

INSERT INTO `one_vs_one_tournaments` (`id`, `tournament_id`, `bracket_generated`, `current_round`, `total_rounds`, `bracket_structure`, `auto_advance`, `match_duration`, `created_at`, `updated_at`) VALUES
(1, 57, 1, 1, 3, NULL, 1, 60, '2025-10-05 09:00:45', '2025-10-05 10:50:15'),
(41, 58, 1, 1, 3, NULL, 1, 60, '2025-10-05 09:24:06', '2025-10-05 10:04:07'),
(49, 59, 1, 1, 2, NULL, 1, 60, '2025-10-05 11:24:39', '2025-10-05 18:28:16'),
(78, 60, 1, 1, 2, NULL, 1, 60, '2025-10-05 20:15:33', '2025-10-05 20:21:17'),
(95, 61, 0, 1, 1, NULL, 1, 60, '2025-10-05 20:28:30', '2025-10-05 20:28:30'),
(126, 62, 0, 1, 1, NULL, 1, 60, '2025-10-06 08:24:12', '2025-10-06 08:24:12'),
(138, 69, 0, 1, 1, NULL, 1, 60, '2025-10-08 15:11:11', '2025-10-08 15:11:11');

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

--
-- Dumping data for table `rank_requirements`
--

INSERT INTO `rank_requirements` (`id`, `rank`, `name`, `min_wins`, `min_matches`, `win_rate`, `min_staked_wins`, `min_stake_amount`, `min_higher_rank_defeats`, `min_tournament_wins`, `min_freeforall_wins`, `min_squad_wins`, `min_onevsone_wins`, `target_rank`, `color`, `glow`) VALUES
(1, 'SSS', 'Supreme', 500, 1000, 80.00, 50, 2000.00, 20, 10, 36, 40, 25, NULL, '#ff00ff', '0 0 15px #ff00ff'),
(2, 'SS', 'Elite', 300, 600, 75.00, 30, 1800.00, 15, 5, 18, 20, 10, 'SSS', '#ff4500', '0 0 12px #ff4500'),
(3, 'S', 'Diamond', 200, 400, 70.00, 20, 1500.00, 10, 0, 9, 10, 4, 'SS', '#ff0000', '0 0 10px #ff0000'),
(4, 'A', 'Platinum', 100, 200, 65.00, 10, 1000.00, 5, 0, 4, 5, 1, 'S', '#ff8c00', '0 0 8px #ff8c00'),
(5, 'B', 'Gold', 50, 100, 60.00, 5, 700.00, 3, 0, 1, 2, 0, 'A', '#ffff00', '0 0 6px #ffff00'),
(6, 'C', 'Silver', 20, 50, 55.00, 0, 0.00, 0, 0, 0, 0, 0, NULL, '#00ff00', '0 0 4px #00ff00'),
(7, 'D', 'Bronze', 10, 25, 50.00, 0, 0.00, 0, 0, 0, 0, 0, NULL, '#1e90ff', '0 0 2px #1e90ff'),
(8, 'E', 'Newbie', 0, 0, 0.00, 0, 0.00, 0, 0, 0, 0, 0, NULL, '#ffffff', '0 0 1px #ffffff');

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

--
-- Dumping data for table `receipt_templates`
--

INSERT INTO `receipt_templates` (`id`, `template_name`, `template_html`, `variables`, `is_default`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Default Receipt', '<div style=\"font-family: Arial, sans-serif; padding: 20px; border: 2px solid #7C3AED; border-radius: 10px;\">\r\n  <h2 style=\"color: #7C3AED;\">XPERIENCE GAMING WALLET</h2>\r\n  <h3>PAYMENT RECEIPT</h3>\r\n  <p><strong>Receipt No:</strong> {{receipt_number}}</p>\r\n  <p><strong>Date:</strong> {{date}}</p>\r\n  <hr>\r\n  <p><strong>Paid To:</strong> {{user_name}}</p>\r\n  <p><strong>Amount:</strong> {{amount}} {{currency}}</p>\r\n  <p><strong>Transaction Type:</strong> {{transaction_type}}</p>\r\n  <hr>\r\n  <p style=\"font-size: 12px; color: #666;\">This is an official receipt from Xperience Gaming Platform</p>\r\n</div>', '[\"receipt_number\", \"date\", \"user_name\", \"amount\", \"currency\", \"transaction_type\"]', 1, NULL, '2025-12-16 22:23:07', '2025-12-16 22:23:07');

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

--
-- Dumping data for table `revenue`
--

INSERT INTO `revenue` (`id`, `tournament_id`, `amount`, `revenue_date`, `notes`) VALUES
(1, 55, 750.00, '2025-10-03 08:22:13', '15% platform fee from freeforall_tournament'),
(2, NULL, 120.00, '2025-10-03 21:22:47', '15% platform fee from 1vs1_match'),
(3, 56, 1500.00, '2025-10-03 22:01:32', '15% platform fee from versus_tournament'),
(4, 57, 2400.00, '2025-10-04 09:24:53', '15% platform fee from onevsone_tournament'),
(5, 59, 240.00, '2025-10-05 11:23:29', '15% platform fee from onevsone_tournament'),
(6, 68, 600.00, '2025-10-07 12:55:49', '15% platform fee from onevsone_tournament'),
(7, 69, 600.00, '2025-10-07 13:27:18', '15% platform fee from onevsone_tournament'),
(8, NULL, 150.00, '2025-10-10 07:03:21', '15% platform fee from 1vs1_match'),
(9, NULL, 75.00, '2025-10-10 07:09:57', '15% platform fee from 1vs1_match'),
(10, NULL, 300.00, '2025-10-10 07:17:32', '15% platform fee from 1vs1_match'),
(11, NULL, 300.00, '2025-10-11 19:21:50', '15% platform fee from 1vs1_match'),
(12, 70, 300.00, '2025-10-11 20:21:05', '15% platform fee from onevsone_tournament'),
(13, NULL, 1500.00, '2025-10-13 11:26:07', '15% platform fee from 1vs1_match'),
(14, NULL, 150.00, '2025-10-13 11:57:47', '15% platform fee from 1vs1_match'),
(15, NULL, 750.00, '2025-10-13 18:11:47', '15% platform fee from 1vs1_match'),
(16, NULL, 1200.00, '2025-10-13 20:41:34', '15% platform fee from 1vs1_match'),
(17, NULL, 300.00, '2025-10-14 11:43:32', '15% platform fee from 1vs1_match'),
(18, NULL, 600.00, '2025-10-14 12:40:46', '15% platform fee from 1vs1_match'),
(19, 37, 750.00, '2025-10-14 12:51:55', '15% platform fee from 1vs1_match'),
(20, NULL, 600.00, '2025-10-14 12:54:55', '15% platform fee from 1vs1_match'),
(21, 72, 3000.00, '2025-10-21 17:09:00', '15% platform fee from squad_tournament'),
(22, 73, 2400.00, '2025-10-24 06:50:10', '15% platform fee from onevsone_tournament'),
(23, 38, 375.00, '2025-10-25 08:44:40', '15% platform fee from 1vs1_match'),
(24, NULL, 300.00, '2025-10-25 08:49:45', '15% platform fee from 1vs1_match'),
(25, 39, 450.00, '2025-10-25 10:14:34', '15% platform fee from 1vs1_match'),
(26, 40, 375.00, '2025-10-25 11:08:39', '15% platform fee from 1vs1_match'),
(27, 41, 375.00, '2025-10-26 06:59:59', '15% platform fee from 1vs1_match'),
(28, 42, 375.00, '2025-10-26 07:10:33', '15% platform fee from 1vs1_match'),
(29, 43, 375.00, '2025-10-26 07:14:40', '15% platform fee from 1vs1_match'),
(30, 44, 375.00, '2025-10-26 07:20:27', '15% platform fee from 1vs1_match'),
(31, 45, 375.00, '2025-10-26 08:55:19', '15% platform fee from 1vs1_match'),
(32, 46, 150.00, '2025-10-26 09:14:46', '15% platform fee from 1vs1_match'),
(33, 74, 1500.00, '2025-10-28 14:04:51', '15% platform fee from onevsone_tournament'),
(34, 75, 1950.00, '2025-10-28 14:07:34', '15% platform fee from freeforall_tournament'),
(35, 76, 1950.00, '2025-10-28 14:09:12', '15% platform fee from freeforall_tournament'),
(36, 77, 1500.00, '2025-10-28 14:13:19', '15% platform fee from onevsone_tournament'),
(37, 78, 3300.00, '2025-10-28 14:19:07', '15% platform fee from squad_tournament'),
(38, 79, 1500.00, '2025-10-31 15:17:13', '15% platform fee from onevsone_tournament'),
(39, 80, 3300.00, '2025-10-31 15:39:03', '15% platform fee from squad_tournament'),
(40, 81, 18150.00, '2025-10-31 15:55:43', '15% platform fee from squad_tournament'),
(41, 82, 1500.00, '2025-11-01 13:58:16', '15% platform fee from onevsone_tournament'),
(42, 83, 1950.00, '2025-11-01 14:04:00', '15% platform fee from onevsone_tournament'),
(43, 84, 4500.00, '2025-11-08 21:46:47', '15% platform fee from squad_tournament'),
(44, 85, 15000.00, '2025-11-12 06:58:02', '15% platform fee from survival_tournament'),
(45, 86, 15000.00, '2025-11-12 08:38:46', '15% platform fee from survival_tournament'),
(46, 86, 12750.00, '2025-11-12 12:34:57', '15% platform fee from survival_tournament'),
(47, 87, 30000.00, '2025-11-13 07:42:23', '15% platform fee from survival_tournament'),
(48, 87, 25500.00, '2025-11-13 18:10:25', '15% platform fee from survival_tournament'),
(49, NULL, 6299.55, '2025-12-29 10:10:28', '15% platform fee from custom prize match'),
(50, NULL, 6299.55, '2025-12-29 10:48:19', '15% platform fee from custom prize match'),
(51, NULL, 6299.70, '2025-12-29 17:17:38', '15% platform fee from custom prize match'),
(52, NULL, 4650.00, '2025-12-29 17:29:59', '15% platform fee from custom prize match'),
(53, NULL, 1500.00, '2025-12-29 23:57:30', '15% platform fee from custom prize match'),
(54, NULL, 1440.00, '2025-12-30 21:20:59', '15% platform fee from 1vs1_match');

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

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `data_type`, `category`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'xp_conversion_rate', '25', 'number', 'wallet', 'XP points per 1000 NGN', 0, NULL, '2025-12-16 22:23:02', '2025-12-16 22:23:02'),
(2, 'min_withdrawal_amount', '1000', 'number', 'wallet', 'Minimum withdrawal in NGN', 0, NULL, '2025-12-16 22:23:02', '2025-12-16 22:23:02'),
(3, 'transfer_fee_percent', '0', 'number', 'wallet', 'Fee percentage on transfers', 0, NULL, '2025-12-16 22:23:02', '2025-12-16 22:23:02'),
(4, 'maintenance_mode', 'false', 'boolean', 'system', 'Enable maintenance mode', 0, NULL, '2025-12-16 22:23:02', '2025-12-16 22:23:02'),
(5, 'contact_email', 'support@xperience.com', 'string', 'system', 'Support email address', 0, NULL, '2025-12-16 22:23:02', '2025-12-16 22:23:02');

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

--
-- Dumping data for table `titles`
--

INSERT INTO `titles` (`id`, `name`, `tier`, `description`, `color`, `icon`, `requirements`, `created_at`) VALUES
(1, 'Aeterna', 'sacred', 'Eternal Champion', '#FFD700', 'crown', NULL, '2025-11-13 20:03:13'),
(2, 'Celestia', 'sacred', 'Divine Warrior', '#FF6B6B', 'star', NULL, '2025-11-13 20:03:13'),
(3, 'Phoenix', 'sacred', 'Reborn from Ashes', '#FF4444', 'phoenix', NULL, '2025-11-13 20:03:13'),
(4, 'Dragonheart', 'sacred', 'Fearless Conqueror', '#FF0000', 'dragon', NULL, '2025-11-13 20:03:13'),
(5, 'Immortal', 'sacred', 'Undefeated Legend', '#00FF00', 'shield', NULL, '2025-11-13 20:03:13'),
(6, 'Titan', 'sacred', 'Unstoppable Force', '#8B4513', 'mountain', NULL, '2025-11-13 20:03:13'),
(7, 'Valkyrie', 'sacred', 'Battle Goddess', '#FF69B4', 'sword-woman', NULL, '2025-11-13 20:03:13'),
(8, 'Warlord', 'sacred', 'Supreme Commander', '#800020', 'helmet', NULL, '2025-11-13 20:03:13'),
(9, 'Oracle', 'sacred', 'Visionary Master', '#9370DB', 'eye', NULL, '2025-11-13 20:03:13'),
(10, 'Zenith', 'sacred', 'Peak Performer', '#00BFFF', 'peak', NULL, '2025-11-13 20:03:13'),
(11, 'Vanguard', 'disputable', 'Frontline Elite', '#FFA500', 'shield-alt', NULL, '2025-11-13 20:03:13'),
(12, 'Gladiator', 'disputable', 'Arena Champion', '#DC143C', 'sword', NULL, '2025-11-13 20:03:13'),
(13, 'Sentinel', 'disputable', 'Guardian Protector', '#1E90FF', 'guard', NULL, '2025-11-13 20:03:13'),
(14, 'Reaper', 'disputable', 'Elimination Expert', '#2F4F4F', 'skull', NULL, '2025-11-13 20:03:13'),
(15, 'Phantom', 'disputable', 'Stealth Master', '#696969', 'ghost', NULL, '2025-11-13 20:03:13'),
(16, 'Juggernaut', 'disputable', 'Unbreakable Wall', '#808080', 'wall', NULL, '2025-11-13 20:03:13'),
(17, 'Virtuoso', 'disputable', 'Technical Genius', '#32CD32', 'wizard', NULL, '2025-11-13 20:03:13'),
(18, 'Maverick', 'disputable', 'Unconventional Master', '#FF8C00', 'rebel', NULL, '2025-11-13 20:03:13'),
(19, 'Archon', 'disputable', 'Strategic Genius', '#4B0082', 'chess', NULL, '2025-11-13 20:03:13'),
(20, 'Catalyst', 'disputable', 'Game Changer', '#00CED1', 'lightning', NULL, '2025-11-13 20:03:13'),
(21, 'Ronin', 'class', 'Masterless Warrior', '#A9A9A9', 'samurai', NULL, '2025-11-13 20:03:13'),
(22, 'Corsair', 'class', 'Adventurous Raider', '#0000FF', 'ship', NULL, '2025-11-13 20:03:13'),
(23, 'Adept', 'class', 'Skilled Specialist', '#008000', 'badge', NULL, '2025-11-13 20:03:13'),
(24, 'Marksman', 'class', 'Precision Expert', '#8B0000', 'target', NULL, '2025-11-13 20:03:13'),
(25, 'Vigilante', 'class', 'Justice Enforcer', '#000080', 'mask', NULL, '2025-11-13 20:03:13'),
(26, 'Nomad', 'class', 'Versatile Wanderer', '#DAA520', 'compass', NULL, '2025-11-13 20:03:13'),
(27, 'Artisan', 'class', 'Craft Master', '#CD853F', 'tools', NULL, '2025-11-13 20:03:13'),
(28, 'Sage', 'class', 'Wise Veteran', '#2E8B57', 'book', NULL, '2025-11-13 20:03:13'),
(29, 'Scout', 'class', 'Recon Specialist', '#228B22', 'binoculars', NULL, '2025-11-13 20:03:13'),
(30, 'Berserker', 'class', 'Furious Combatant', '#B22222', 'axe', NULL, '2025-11-13 20:03:13');

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

--
-- Dumping data for table `tournaments`
--

INSERT INTO `tournaments` (`id`, `name`, `game`, `description`, `creator_id`, `group_id`, `max_players`, `max_groups`, `min_players`, `xp_entry_fee`, `team_based`, `prize_pool`, `custom_prize_pool`, `platform_fee`, `start_date`, `completed_at`, `status`, `winner_id`, `created_at`, `updated_at`, `type`, `admin_pin`, `live_stream_url`, `prize_pool_option`, `title_requirements_boundless`, `title_requirements_chaos`, `title_requirements_order`, `additional_awards`, `title_boundless_winner`, `title_chaos_winner`, `title_order_winner`, `currency`, `max_squads`, `max_players_per_squad`, `squad_name`, `admin_monitoring`, `dispute_resolution`) VALUES
(1, 'group Tournament - Jul 3', 'Call of Duty: Warzone', NULL, 4, NULL, 3, NULL, 2, 1000.00, 0, 20000.00, 0.00, 0.00, '2025-07-04 02:49:00', NULL, '', NULL, '2025-07-03 09:12:47', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(2, 'group Tournament - Jul 3', 'Call of Duty: Warzone', NULL, 4, NULL, 10, NULL, 2, 1000.00, 0, 9000.00, 0.00, 0.00, '2025-07-04 03:59:00', NULL, 'upcoming', NULL, '2025-07-03 10:00:30', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(3, 'group Tournament - Jul 6', 'Call of Duty: Warzone', NULL, 7, NULL, 4, NULL, 2, 500.00, 0, 1800.00, 0.00, 0.00, '2025-07-07 20:09:00', NULL, 'upcoming', NULL, '2025-07-06 02:10:17', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(4, 'group Tournament - Jul 6', 'Chess', NULL, 1, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-07-08 20:11:00', NULL, 'completed', NULL, '2025-07-06 02:12:22', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(5, 'group Tournament - Jul 6', 'Call of Duty: Warzone', NULL, 4, NULL, 5, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-07-10 20:53:00', NULL, 'completed', NULL, '2025-07-06 02:53:31', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(6, 'group Tournament - Jul 7', 'Call of Duty: Warzone', NULL, 1, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-07-08 13:56:00', NULL, 'completed', NULL, '2025-07-07 19:56:59', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(7, 'individual Tournament - Jul 18', 'Call of Duty: Warzone', NULL, 1, NULL, 2, NULL, 2, 500.00, 0, 900.00, 0.00, 0.00, '2025-07-19 23:04:00', NULL, 'upcoming', NULL, '2025-07-18 05:05:22', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(11, 'group Tournament - Jul 18', 'Call of Duty: Warzone', NULL, 1, NULL, 10, NULL, 2, 500.00, 0, 4500.00, 0.00, 0.00, '2025-07-19 23:26:00', NULL, 'upcoming', NULL, '2025-07-18 05:45:31', '2025-07-18 05:45:31', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(12, 'group Tournament - Jul 18', 'Call of Duty: Warzone', NULL, 1, NULL, 20, NULL, 2, 4000.00, 0, 72000.00, 0.00, 0.00, '2025-07-19 00:24:00', NULL, 'upcoming', NULL, '2025-07-18 06:25:34', '2025-07-18 06:25:34', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(13, 'conquer', 'Call of Duty: Warzone', NULL, 4, NULL, 10, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-07-23 09:53:00', NULL, 'completed', NULL, '2025-07-21 15:54:08', '2025-07-21 21:24:17', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(14, 'group Tournament - Jul 22', 'Call of Duty: Warzone', NULL, 7, NULL, 20, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-07-23 15:59:00', NULL, 'upcoming', NULL, '2025-07-21 22:00:30', '2025-07-21 22:00:30', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(16, 'group Tournament - Jul 29', 'PUBG', 'we win', 7, NULL, 12, 3, 2, 0.00, 0, 7000.00, 0.00, 0.00, '2025-07-31 23:29:00', NULL, 'ongoing', NULL, '2025-07-29 06:28:28', '2025-07-29 22:23:34', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(17, 'individual Tournament - Jul 29', 'FIFA 23', NULL, 7, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-07-31 10:30:00', NULL, 'upcoming', NULL, '2025-07-29 17:29:50', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(20, 'individual Tournament - Jul 31', 'Call of Duty: Warzone', '', 13, NULL, 4, NULL, 2, 0.00, 0, 5000.00, 0.00, 0.00, '2025-08-03 06:01:00', NULL, 'upcoming', NULL, '2025-07-31 13:01:06', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(22, 'group Tournament - Jul 31', 'Call of Duty: Warzone', NULL, 12, NULL, 0, 3, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-03 06:31:00', NULL, 'upcoming', NULL, '2025-07-31 13:31:01', '2025-07-31 13:31:01', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(23, 'group Tournament - Aug 2', 'Call of Duty: Warzone', NULL, 10, NULL, 0, 3, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-03 18:17:00', NULL, 'upcoming', NULL, '2025-08-02 01:17:07', '2025-08-02 01:17:07', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(24, 'individual Tournament - Aug 23', 'Call of Duty: Warzone', '', 3, NULL, 4, NULL, 2, 600.00, 0, 1350.00, 0.00, 0.00, '2025-08-24 17:32:00', NULL, 'upcoming', NULL, '2025-08-22 23:32:56', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(25, 'group Tournament - Aug 23', 'Call of Duty: Warzone', NULL, 3, NULL, 0, 3, 2, 1000.00, 0, 2700.00, 0.00, 0.00, '2025-08-24 18:37:00', NULL, 'upcoming', NULL, '2025-08-22 23:38:13', '2025-08-22 23:38:13', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(26, 'group Tournament - Aug 23', 'Call of Duty: Warzone', NULL, 4, NULL, 0, 3, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-26 18:45:00', NULL, 'upcoming', NULL, '2025-08-22 23:45:59', '2025-08-22 23:45:59', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(27, 'individual Tournament - Aug 26', 'Valorant', NULL, 9, 0, 40, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-29 15:43:00', NULL, 'upcoming', NULL, '2025-08-26 21:44:45', '2025-08-27 01:35:25', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(28, 'squad Tournament - Aug 26', 'Call of Duty: Warzone', NULL, 9, 4, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-30 15:44:00', NULL, 'upcoming', NULL, '2025-08-26 21:45:31', '2025-08-26 21:45:31', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(29, 'squad Tournament - Aug 28', 'Call of Duty: Warzone', NULL, 11, 5, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-31 16:32:00', NULL, 'upcoming', NULL, '2025-08-27 22:34:01', '2025-08-27 22:34:01', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(30, 'individual Tournament - Aug 28', 'Call of Duty: Warzone', NULL, 3, 0, 40, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-30 17:00:00', NULL, 'upcoming', NULL, '2025-08-27 23:01:42', '2025-08-27 23:01:42', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(31, 'individual Tournament - Aug 28', 'Call of Duty: Warzone', NULL, 4, 0, 20, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-30 18:50:00', NULL, 'cancelled', NULL, '2025-08-28 00:51:11', '2025-10-22 17:22:04', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(32, 'squad Tournament - Aug 28', 'Call of Duty: Warzone', NULL, 12, 5, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-30 19:27:00', NULL, 'upcoming', NULL, '2025-08-28 01:28:43', '2025-08-28 01:28:43', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(33, 'individual Tournament - Aug 29', 'Valorant', NULL, 3, 0, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-08-29 19:28:00', NULL, 'upcoming', NULL, '2025-08-29 07:29:07', '2025-08-29 07:29:07', '', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(34, 'squad Tournament - Sep 6', 'Call of Duty: Warzone', NULL, 4, 1, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-09-09 19:25:00', NULL, 'upcoming', NULL, '2025-09-06 01:25:35', '2025-09-06 01:25:35', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(35, 'survival Tournament - Sep 11', 'Call of Duty: Warzone', '', 3, NULL, 50, NULL, 2, 0.00, 0, 100000.00, 0.00, 0.00, '2025-09-13 14:17:00', NULL, 'cancelled', NULL, '2025-09-11 19:18:40', '2025-10-22 17:18:15', 'survival', '0303', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(36, 'freeforall Tournament - Sep 11', 'Call of Duty: Warzone', NULL, 4, NULL, 50, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-09-13 13:34:00', NULL, 'cancelled', NULL, '2025-09-11 19:35:32', '2025-10-22 17:20:43', 'freeforall', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(37, 'freeforall Tournament - Sep 12', 'Call of Duty: Warzone', '', 4, NULL, 20, NULL, 2, 0.00, 0, 0.00, 0.00, 750.00, '2025-09-14 18:18:00', '2025-09-30 06:08:29', 'completed', 9, '2025-09-12 00:19:05', '2025-10-14 12:51:55', 'freeforall', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(40, 'Free-for-All Tournament - Call of Duty: Warzone', 'Call of Duty: Warzone', NULL, 4, NULL, 40, NULL, 2, 0.00, 0, 200000.00, 0.00, 375.00, '2025-09-16 06:59:00', NULL, 'cancelled', NULL, '2025-09-16 05:06:49', '2025-10-25 11:08:39', 'freeforall', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(41, 'survive', 'free fire', NULL, 4, NULL, 50, NULL, 2, 0.00, 0, 600000.00, 0.00, 375.00, '2025-09-20 22:01:00', NULL, 'cancelled', NULL, '2025-09-16 20:02:24', '2025-10-26 06:59:59', 'survival', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(42, 'freeforall Tournament - Sep 16', 'PUBG', NULL, 9, NULL, 20, NULL, 2, 0.00, 0, 0.00, 0.00, 375.00, '2025-09-19 14:05:00', NULL, 'cancelled', NULL, '2025-09-16 20:06:35', '2025-10-26 07:10:33', 'freeforall', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(43, 'Free-for-All Tournament - Call of Duty: Warzone', 'Call of Duty: Warzone', NULL, 9, NULL, 50, NULL, 2, 0.00, 0, 100000.00, 0.00, 375.00, '2025-09-16 22:09:00', NULL, 'cancelled', NULL, '2025-09-16 20:09:55', '2025-10-26 07:14:40', 'freeforall', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(44, 'Squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, 3, 20, 4, 2, 0.00, 0, 0.00, 0.00, 375.00, '2025-09-30 19:00:00', NULL, 'upcoming', NULL, '2025-09-26 16:34:23', '2025-10-26 07:20:27', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(45, 'squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, NULL, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 375.00, '2025-09-30 19:00:00', NULL, 'upcoming', NULL, '2025-09-26 16:37:53', '2025-10-26 08:55:19', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(46, 'squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, NULL, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 150.00, '2025-09-30 19:00:00', NULL, 'upcoming', NULL, '2025-09-26 16:39:02', '2025-10-26 09:14:46', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(47, 'squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, NULL, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-09-30 19:00:00', NULL, 'upcoming', NULL, '2025-09-26 16:40:49', '2025-09-26 16:40:49', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(48, 'squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, NULL, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-09-30 19:00:00', NULL, 'upcoming', NULL, '2025-09-26 16:44:18', '2025-09-26 16:44:18', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(49, 'squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, NULL, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-09-30 19:00:00', NULL, 'upcoming', NULL, '2025-09-26 16:45:53', '2025-09-26 16:45:53', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(50, 'Squad Tournament - Sep 26', 'Call of Duty: Warzone', NULL, 4, 3, 20, 4, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-09-29 19:00:00', '2025-09-30 06:06:31', 'completed', 8, '2025-09-26 18:43:21', '2025-09-29 17:06:31', 'squad', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(51, 'freeforall Tournament - Oct 1', 'Call of Duty: Warzone', '', 1, NULL, 10, NULL, 2, 2000.00, 0, 100000.00, 0.00, 3000.00, '2025-10-03 19:00:00', '2025-10-02 23:09:31', 'completed', 8, '2025-10-01 21:39:33', '2025-10-03 06:51:49', 'freeforall', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(52, 'Squad Tournament - Oct 2', 'Fortnite', NULL, 8, 4, 20, 4, 2, 5000.00, 0, 18000.00, 0.00, 3000.00, '2025-10-04 19:00:00', '2025-10-02 23:30:41', 'completed', 4, '2025-10-02 10:11:16', '2025-10-03 06:51:49', 'squad', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(53, 'survival Tournament - Oct 2', 'Call of Duty: Warzone', '', 3, NULL, 100, NULL, 2, 2000.00, 0, 250000.00, 0.00, 30000.00, '2025-10-04 19:00:00', NULL, 'cancelled', NULL, '2025-10-02 10:38:02', '2025-10-21 10:41:48', 'survival', '0303', '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(54, 'freeforall Tournament - Oct 3', 'Call of Duty: Warzone', '', 4, NULL, 5, NULL, 2, 1000.00, 0, 4250.00, 0.00, 0.00, '2025-10-05 19:00:00', NULL, 'completed', NULL, '2025-10-03 07:36:52', '2025-10-22 17:24:32', 'freeforall', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(55, 'freeforall Tournament - Oct 3', 'Call of Duty: Warzone', NULL, 4, NULL, 5, NULL, 2, 1000.00, 0, 4250.00, 0.00, 0.00, '2025-10-05 19:00:00', NULL, 'cancelled', NULL, '2025-10-03 08:22:13', '2025-10-22 17:22:17', 'freeforall', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(56, 'versus Tournament - Oct 4', 'Call of Duty: Warzone', NULL, 3, NULL, 10, NULL, 2, 1000.00, 0, 8500.00, 0.00, 0.00, '2025-10-05 19:00:00', NULL, 'upcoming', NULL, '2025-10-03 22:01:32', '2025-10-03 22:01:32', '', '', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(57, '1v1 Tournament - Oct 4', 'Call of Duty: Warzone', '', 1, NULL, 8, NULL, 2, 1000.00, 0, 13600.00, 0.00, 0.00, '2025-10-06 19:00:00', NULL, 'ongoing', NULL, '2025-10-04 09:24:53', '2025-10-05 09:04:54', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(58, '1v1 Tournament - Oct 4', 'Call of Duty: Warzone', '', 1, NULL, 8, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-06 19:00:00', NULL, 'cancelled', NULL, '2025-10-04 12:40:30', '2025-10-22 17:19:34', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(59, '1v1 Tournament - Oct 5', 'Call of Duty: Warzone', '', 1, NULL, 4, NULL, 2, 400.00, 0, 1360.00, 0.00, 0.00, '2025-10-07 19:00:00', NULL, 'ongoing', NULL, '2025-10-05 11:23:29', '2025-10-05 11:28:57', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(60, '1v1 Tournament - Oct 5', 'Fortnite', '', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-07 19:00:00', NULL, 'ongoing', NULL, '2025-10-05 20:14:32', '2025-10-06 11:09:45', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(61, '1v1 Tournament - Oct 5', 'Call of Duty: Warzone', '', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-08 19:00:00', NULL, 'completed', NULL, '2025-10-05 20:27:45', '2025-10-22 17:25:09', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(62, '1v1 Tournament - Oct 6', 'FIFA 23', '', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-08 19:00:00', NULL, 'completed', NULL, '2025-10-06 08:07:04', '2025-10-12 12:26:59', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(63, '1v1 Tournament - Oct 6', 'Call of Duty: Warzone', '', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-08 19:00:00', NULL, 'ongoing', NULL, '2025-10-06 09:12:15', '2025-10-06 09:18:36', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(64, '1v1 Tournament - Oct 6', 'PUBG', '', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-08 19:00:00', NULL, 'ongoing', NULL, '2025-10-06 11:10:56', '2025-10-06 11:14:02', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(65, '1v1 Tournament - Oct 6', 'Dota 2', '', 8, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-09 19:00:00', NULL, 'ongoing', NULL, '2025-10-06 15:42:10', '2025-10-06 15:46:01', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(66, '1v1 Tournament - Oct 6', 'Call of Duty: Warzone', '', 8, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-09 19:00:00', NULL, 'ongoing', NULL, '2025-10-06 16:31:38', '2025-10-06 16:34:33', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(67, '1v1 Tournament - Oct 7', 'Call of Duty: Warzone', '', 8, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-09 19:00:00', NULL, 'completed', NULL, '2025-10-07 08:26:01', '2025-10-07 12:53:46', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(68, '1v1 Tournament - Oct 7', 'Call of Duty: Warzone', '', 8, NULL, 4, NULL, 2, 1000.00, 0, 3400.00, 0.00, 0.00, '2025-10-09 19:00:00', NULL, 'completed', NULL, '2025-10-07 12:55:49', '2025-10-07 13:07:54', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(69, '1v1 Tournament - Oct 7', 'Call of Duty: Warzone', '', 4, NULL, 4, NULL, 2, 1000.00, 0, 3400.00, 0.00, 0.00, '2025-10-09 19:00:00', '2025-10-09 09:44:37', 'completed', 8, '2025-10-07 13:27:18', '2025-10-08 20:44:37', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(70, '1v1 Tournament - Oct 11', 'Call of Duty: Warzone', '', 4, NULL, 4, NULL, 2, 500.00, 0, 1700.00, 0.00, 0.00, '2025-10-13 19:00:00', NULL, 'ongoing', NULL, '2025-10-11 20:21:05', '2025-10-12 09:11:24', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(71, '1v1 Tournament - Oct 12', 'Call of Duty: Warzone', '', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-10-15 19:00:00', '2025-10-14 00:19:42', 'completed', 4, '2025-10-12 12:28:45', '2025-10-13 11:19:42', '', NULL, '', 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(72, 'Squad Tournament - Oct 21', 'Call of Duty: Warzone', NULL, 4, 3, 20, 4, 2, 5000.00, 0, 17000.00, 0.00, 0.00, '2025-10-23 19:00:00', '2025-10-22 06:25:33', 'completed', 14, '2025-10-21 17:09:00', '2025-10-21 17:25:33', 'squad', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(74, '1v1 Tournament - Oct 28', 'Fortnite', NULL, 1, NULL, 8, NULL, 2, 1000.00, 0, 8500.00, 10000.00, 1500.00, '2025-10-30 19:00:00', NULL, 'upcoming', NULL, '2025-10-28 14:04:51', '2025-10-28 14:04:51', '', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(75, 'freeforall Tournament - Oct 28', 'Call of Duty: Mobile', NULL, 1, NULL, 8, NULL, 2, 1500.00, 0, 11050.00, 13000.00, 1950.00, '2025-10-30 19:00:00', NULL, 'upcoming', NULL, '2025-10-28 14:07:34', '2025-10-28 14:07:34', 'freeforall', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(76, 'freeforall Tournament - Oct 28', 'Call of Duty: Mobile', NULL, 1, NULL, 8, NULL, 2, 1500.00, 0, 11050.00, 13000.00, 1950.00, '2025-10-30 19:00:00', NULL, 'upcoming', NULL, '2025-10-28 14:09:12', '2025-10-28 14:09:12', 'freeforall', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(77, '1v1 Tournament - Oct 28', 'Free Fire', NULL, 1, NULL, 8, NULL, 2, 1000.00, 0, 8500.00, 10000.00, 1500.00, '2025-10-30 19:00:00', NULL, 'upcoming', NULL, '2025-10-28 14:13:19', '2025-10-28 14:13:19', '', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(78, 'Squad Tournament - Oct 28', 'Overwatch 2', NULL, 1, 2, 20, 4, 2, 1000.00, 0, 18700.00, 22000.00, 3300.00, '2025-10-30 19:00:00', NULL, 'upcoming', NULL, '2025-10-28 14:19:07', '2025-10-28 14:19:07', 'squad', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(79, '1v1 Tournament - Oct 31', 'Call of Duty: Mobile', NULL, 4, NULL, 8, NULL, 2, 1000.00, 0, 8500.00, 10000.00, 1500.00, '2025-11-03 19:00:00', NULL, 'upcoming', NULL, '2025-10-31 15:17:13', '2025-10-31 15:17:13', '', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(80, 'Squad Tournament - Oct 31', 'Overwatch 2', NULL, 4, 3, 20, 4, 2, 1000.00, 0, 18700.00, 22000.00, 3300.00, '2025-11-02 19:00:00', NULL, 'upcoming', NULL, '2025-10-31 15:39:02', '2025-10-31 15:39:02', 'squad', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(81, 'Squad Tournament - Oct 31', 'PUBG', NULL, 1, 2, 20, 4, 2, 6000.00, 0, 102850.00, 121000.00, 18150.00, '2025-11-03 19:00:00', NULL, 'upcoming', NULL, '2025-10-31 15:55:43', '2025-10-31 15:55:43', 'squad', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(82, '1v1 Tournament - Nov 1', 'Call of Duty: Warzone', NULL, 1, NULL, 8, NULL, 2, 1000.00, 0, 8500.00, 10000.00, 1500.00, '2025-11-03 19:00:00', NULL, 'upcoming', NULL, '2025-11-01 13:58:16', '2025-11-01 13:58:16', '', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(83, '1v1 Tournament - Nov 1', 'Valorant', NULL, 1, NULL, 8, NULL, 2, 1200.00, 0, 11050.00, 13000.00, 1950.00, '2025-11-04 19:00:00', NULL, 'upcoming', NULL, '2025-11-01 14:04:00', '2025-11-01 14:04:00', '', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(84, 'Squad Tournament - Nov 8', 'Call of Duty: Mobile', NULL, 1, 2, 20, 4, 2, 7000.00, 0, 25500.00, 30000.00, 0.00, '2025-11-11 19:00:00', NULL, 'upcoming', NULL, '2025-11-08 21:46:47', '2025-11-08 21:46:47', 'squad', NULL, NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(86, 'survival Tournament - Nov 12', 'Call of Duty: Warzone', '', 3, NULL, 8, NULL, 2, 1000.00, 0, 85000.00, 100000.00, 0.00, '2025-11-14 19:00:00', '2025-11-13 01:34:57', 'completed', 4, '2025-11-12 08:38:46', '2025-11-12 12:35:50', 'survival', '1212', '', 'custom', NULL, '16', '1', 'wanted notice', NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(87, 'survival Tournament - Nov 13', 'Call of Duty: Mobile', NULL, 3, NULL, 8, NULL, 2, 1000.00, 0, 170000.00, 200000.00, 0.00, '2025-11-16 19:00:00', '2025-11-14 07:10:25', 'completed', 4, '2025-11-13 07:42:23', '2025-11-13 19:07:31', 'survival', '1212', NULL, 'custom', NULL, '1', '16', 'Notice on the xp bounty list to take down', 4, 1, 16, 'xp', 8, 5, NULL, 0, 'auto'),
(88, 'WAR', 'Call of Duty: Mobile', '', 4, NULL, 8, NULL, 2, 1100.00, 0, 7480.00, 0.00, 1320.00, '2025-12-02 01:48:00', NULL, 'upcoming', NULL, '2025-11-29 12:49:06', '2025-11-29 12:49:06', 'freeforall', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(89, 'the first', 'Call of Duty: Mobile', NULL, 4, NULL, 8, NULL, 2, 2000.00, 0, 13600.00, 0.00, 2400.00, '2025-12-03 08:30:00', NULL, 'ongoing', NULL, '2025-11-30 20:04:33', '2025-12-03 10:45:51', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(90, 'Test Tournament', 'Call of Duty: Mobile', 'last mand standing in the tournament', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-12-04 07:36:00', NULL, 'upcoming', NULL, '2025-12-03 17:36:39', '2025-12-03 17:36:39', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(91, 'Test Tournament', 'Call of Duty: Mobile', 'last mand standing in the tournament', 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-12-04 07:36:00', NULL, 'ongoing', NULL, '2025-12-03 17:36:45', '2025-12-03 17:41:09', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(92, 'war', 'Call of Duty: Mobile', NULL, 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-12-08 01:39:00', NULL, 'upcoming', NULL, '2025-12-05 12:39:54', '2025-12-05 12:39:54', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(93, 'the first', 'Call of Duty: Mobile', NULL, 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-12-24 04:21:00', NULL, 'upcoming', NULL, '2025-12-22 15:21:13', '2025-12-22 15:21:13', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(94, 'the first', 'Call of Duty: Mobile', NULL, 4, NULL, 4, NULL, 2, 0.00, 0, 0.00, 0.00, 0.00, '2025-12-24 04:21:00', NULL, 'upcoming', NULL, '2025-12-22 15:24:35', '2025-12-22 15:24:35', '', NULL, NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 0, 'auto'),
(98, 'conquer', 'Call of Duty: Mobile', 'group with the most kills', 8, 4, 4, NULL, 2, 500.00, 0, 1700.00, 0.00, 300.00, '2026-01-07 21:17:00', '2026-01-06 10:41:01', 'completed', 4, '2026-01-06 05:52:47', '2026-01-06 18:41:01', 'squad', '', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 4, 5, NULL, 1, 'voting'),
(99, 'survive', 'Call of Duty: Mobile', 'most kills', 3, NULL, 8, NULL, 2, 1020.00, 0, 6936.00, 0.00, 1224.00, '2026-01-08 20:24:00', NULL, 'upcoming', NULL, '2026-01-07 04:44:15', '2026-01-07 04:44:15', 'survival', '', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'admin'),
(100, 'survive', 'Call of Duty: Mobile', 'most kills', 3, NULL, 8, NULL, 2, 1060.00, 0, 7208.00, 0.00, 1272.00, '2026-01-09 21:01:00', '2026-01-06 21:18:35', 'completed', 8, '2026-01-07 05:01:59', '2026-01-07 05:18:35', 'survival', '', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'admin'),
(101, 'winners', 'Call of Duty: Mobile', 'most kills', 8, NULL, 6, NULL, 2, 740.00, 0, 3774.00, 0.00, 666.00, '2026-01-08 21:20:00', NULL, 'upcoming', NULL, '2026-01-07 05:21:07', '2026-01-07 05:21:07', 'freeforall', '', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(102, 'survive', 'PUBG Mobile', 'player with the most kills', 15, 8, 4, NULL, 2, 0.00, 0, 807.50, 950.00, 142.50, '2026-01-08 10:34:00', NULL, 'upcoming', NULL, '2026-01-07 18:36:21', '2026-01-07 18:36:21', 'squad', '1212', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 3, 5, 'gradust@gmail.com', 1, 'voting'),
(103, 'survivor', 'Call of Duty: Mobile', 'top three most kills', 3, NULL, 4, NULL, 2, 0.00, 0, 909.50, 1070.00, 160.50, '2026-01-09 09:30:00', '2026-01-08 09:54:36', 'completed', 8, '2026-01-08 17:32:42', '2026-01-08 17:54:36', 'survival', '', NULL, 'custom', 'most kills', 'second most kills', 'kill the highest killer at least three times', NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'admin'),
(104, 'last man standing', 'Call of Duty: Mobile', NULL, 8, NULL, 4, NULL, 2, 410.00, 0, 960.50, 1130.00, 169.50, '2026-01-11 17:17:00', NULL, 'ongoing', NULL, '2026-01-10 01:18:56', '2026-01-10 07:42:22', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(105, 'conquer 2', 'Call of Duty: Warzone', NULL, 8, NULL, 4, NULL, 2, 490.00, 0, 1666.00, 0.00, 294.00, '2026-01-11 01:43:00', NULL, 'upcoming', NULL, '2026-01-10 09:43:56', '2026-01-10 09:43:56', '1v1', '', NULL, 'entry_fee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(106, 'conquer 3', 'Call of Duty: Warzone', NULL, 8, NULL, 4, NULL, 2, 0.00, 0, 816.00, 960.00, 144.00, '2026-01-11 01:45:00', NULL, 'ongoing', NULL, '2026-01-10 09:45:55', '2026-01-10 09:47:36', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(107, 'conquer 4', 'Call of Duty: Warzone', NULL, 8, NULL, 8, NULL, 2, 0.00, 0, 544.00, 640.00, 96.00, '2026-01-11 12:00:00', '2026-01-11 21:43:34', 'completed', 12, '2026-01-10 20:00:30', '2026-01-12 05:43:34', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(108, 'conquer 5', 'Call of Duty: Mobile', NULL, 8, NULL, 8, NULL, 2, 0.00, 0, 790.50, 930.00, 139.50, '2026-01-13 21:46:00', '2026-01-11 22:10:11', 'completed', 16, '2026-01-12 05:47:42', '2026-01-12 06:10:11', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(109, 'conquer 6', 'Call of Duty: Warzone', NULL, 8, NULL, 8, NULL, 2, 0.00, 0, 688.50, 810.00, 121.50, '2026-01-13 22:21:00', '2026-01-11 23:43:52', 'completed', 8, '2026-01-12 06:21:56', '2026-01-12 07:43:52', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'admin'),
(110, 'conquer 7', 'Call of Duty: Mobile', NULL, 8, NULL, 8, NULL, 2, 0.00, 0, 697.00, 820.00, 123.00, '2026-01-13 23:44:00', '2026-01-11 23:53:36', 'completed', 4, '2026-01-12 07:44:46', '2026-01-12 07:53:36', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'voting'),
(111, 'conquer 8', 'Call of Duty: Mobile', NULL, 8, NULL, 16, NULL, 2, 0.00, 0, 297.50, 350.00, 52.50, '2026-01-13 23:54:00', NULL, 'ongoing', NULL, '2026-01-12 07:55:06', '2026-01-12 08:07:28', '1v1', '', NULL, 'custom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'xp', 8, 5, NULL, 1, 'auto');

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

--
-- Dumping data for table `tournament_admins`
--

INSERT INTO `tournament_admins` (`id`, `tournament_id`, `admin_id`, `role`, `added_by`, `added_at`, `permissions`) VALUES
(1, 98, 8, 'full_access', 8, '2026-01-06 05:52:47', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(2, 99, 3, 'full_access', 3, '2026-01-07 04:44:15', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(3, 100, 3, 'full_access', 3, '2026-01-07 05:01:59', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(4, 101, 8, 'full_access', 8, '2026-01-07 05:21:07', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(5, 102, 15, 'full_access', 15, '2026-01-07 18:36:21', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(6, 103, 3, 'full_access', 3, '2026-01-08 17:32:42', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(7, 104, 8, 'full_access', 8, '2026-01-10 01:19:06', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(8, 105, 8, 'full_access', 8, '2026-01-10 09:43:56', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(9, 106, 8, 'full_access', 8, '2026-01-10 09:45:55', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(10, 107, 8, 'full_access', 8, '2026-01-10 20:00:45', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(11, 108, 8, 'full_access', 8, '2026-01-12 05:47:42', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(12, 109, 8, 'full_access', 8, '2026-01-12 06:21:56', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(13, 110, 8, 'full_access', 8, '2026-01-12 07:44:46', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}'),
(14, 111, 8, 'full_access', 8, '2026-01-12 07:55:06', '{\"monitor_matches\":true,\"resolve_disputes\":true,\"override_results\":true,\"kick_players\":true,\"distribute_prizes\":true,\"modify_tournament\":true}');

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

--
-- Dumping data for table `tournament_chat`
--

INSERT INTO `tournament_chat` (`id`, `tournament_id`, `user_id`, `message`, `created_at`) VALUES
(1, 2, 4, 'how far guys', '2025-07-03 10:12:00'),
(2, 2, 4, 'are you guys ready', '2025-07-03 10:12:27'),
(3, 2, 4, 'how far', '2025-07-03 10:18:52'),
(4, 2, 4, 'how far', '2025-07-03 10:18:52'),
(5, 2, 4, 'how far', '2025-07-03 10:18:58'),
(6, 2, 4, 'how far', '2025-07-03 10:18:58'),
(7, 2, 4, 'bro', '2025-07-03 10:19:32'),
(8, 2, 4, 'how', '2025-07-03 10:20:02'),
(9, 2, 4, 'u dey alright', '2025-07-03 10:20:24'),
(10, 2, 4, 'u dey alright', '2025-07-03 10:22:51'),
(11, 2, 4, 'how far', '2025-07-03 10:23:39'),
(12, 2, 4, 'how far', '2025-07-03 10:23:50'),
(13, 2, 4, 'hello', '2025-07-03 10:26:05'),
(14, 2, 4, 'hello', '2025-07-03 10:26:30'),
(15, 4, 4, 'how far', '2025-07-06 02:25:28'),
(16, 5, 1, 'how far niggas', '2025-07-06 02:59:31'),
(17, 5, 1, 'omo bro i dey with you', '2025-07-06 02:59:52'),
(18, 5, 1, 'who dey paly frst', '2025-07-06 03:00:24'),
(19, 5, 1, 'how fa', '2025-07-06 03:04:58'),
(20, 5, 1, 'bro i dey', '2025-07-06 03:05:21'),
(21, 6, 4, 'how far', '2025-07-07 20:00:53'),
(22, 6, 4, 'i dey bro', '2025-07-07 20:01:57'),
(23, 6, 1, 'how far na', '2025-07-07 21:02:54'),
(24, 6, 4, 'i dey bro', '2025-07-07 21:04:03'),
(25, 6, 1, 'are you ready', '2025-07-07 21:05:42'),
(26, 6, 1, 'ye', '2025-07-07 21:05:55'),
(27, 6, 6, 'oya make i start', '2025-07-07 21:10:49'),
(28, 6, 1, 'sharp', '2025-07-07 21:12:28'),
(29, 7, 1, 'how far niggas are you ready', '2025-07-19 06:20:14'),
(30, 5, 4, 'u na don dey ready', '2025-07-20 18:56:55'),
(31, 5, 6, 'am new here bro', '2025-07-20 19:03:13'),
(32, 5, 7, 'hello bro', '2025-07-20 19:04:32'),
(33, 5, 4, 'i guess we are all set', '2025-07-20 19:05:40'),
(34, 13, 4, 'how far niggas are you ready', '2025-07-21 16:34:55'),
(35, 11, 1, 'ho', '2025-07-21 20:52:23'),
(36, 35, 12, 'how far niggas are you ready', '2025-09-16 03:31:02'),
(37, 50, 1, 'greetings group admins the game will commence shortly', '2025-09-27 15:07:12'),
(38, 50, 1, 'the room link will be sent soon', '2025-09-27 15:07:35'),
(39, 50, 4, 'ok now we start', '2025-09-27 15:29:36'),
(40, 98, 15, 'how farbrethrens', '2026-01-06 18:31:51'),
(41, 98, 8, 'i dey bro are your guys ready', '2026-01-06 18:33:15'),
(42, 98, 15, 'yeah bro', '2026-01-06 18:33:30'),
(43, 98, 9, 'omo this tournament will be bloody', '2026-01-06 18:34:51'),
(44, 98, 8, 'dey play', '2026-01-06 18:35:00'),
(45, 103, 16, 'how far bro', '2026-01-08 17:39:55'),
(46, 103, 8, 'i dey bro', '2026-01-08 17:40:03'),
(47, 103, 16, 'when we dey start', '2026-01-08 17:40:18'),
(48, 103, 8, 'omo me i neva sabi make admin talk', '2026-01-08 17:40:52'),
(49, 103, 3, 'ok we are going to be starting shotly', '2026-01-08 17:41:55'),
(50, 103, 8, 'celebrate grace', '2026-01-08 17:42:10');

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

--
-- Dumping data for table `tournament_invites`
--

INSERT INTO `tournament_invites` (`id`, `tournament_id`, `invite_code`, `created_by`, `created_at`, `expires_at`, `max_uses`, `use_count`, `last_used_at`, `is_active`) VALUES
(1, 99, 'INV-1767761878996-a7xoff163', 3, '2026-01-07 04:57:59', '2026-01-07 20:57:58', 50, 0, NULL, 1),
(2, 99, 'INV-1767761945028-5lvxwolq8', 3, '2026-01-07 04:59:05', '2026-01-07 20:59:05', 50, 0, NULL, 1);

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

--
-- Dumping data for table `tournament_matches`
--

INSERT INTO `tournament_matches` (`id`, `tournament_id`, `player1_id`, `player2_id`, `round_number`, `match_time`, `completed_at`, `winner_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 4, 6, 4, 1, '2025-07-06 05:16:05', NULL, NULL, 'upcoming', '2025-07-06 02:16:05', '2025-07-06 02:16:05'),
(2, 4, 5, 1, 1, '2025-07-06 05:16:05', NULL, NULL, 'upcoming', '2025-07-06 02:16:05', '2025-07-06 02:16:05'),
(3, 6, 6, 1, 1, '2025-07-08 00:12:41', NULL, NULL, 'upcoming', '2025-07-07 21:12:41', '2025-07-07 21:12:41'),
(4, 6, 5, 4, 1, '2025-07-08 00:12:41', NULL, NULL, 'upcoming', '2025-07-07 21:12:41', '2025-07-07 21:12:41'),
(5, 5, 7, 5, 1, '2025-07-10 20:53:00', NULL, NULL, 'upcoming', '2025-07-20 19:06:06', '2025-07-20 19:06:06'),
(6, 5, 1, 6, 2, '2025-07-10 21:53:00', NULL, NULL, 'upcoming', '2025-07-20 19:06:07', '2025-07-20 19:06:07'),
(7, 5, 4, 7, 3, '2025-07-10 22:53:00', NULL, NULL, 'upcoming', '2025-07-20 19:06:07', '2025-07-20 19:06:07'),
(12, 89, 12, 8, 1, '2025-12-03 08:30:00', NULL, NULL, 'ongoing', '2025-12-03 10:41:17', '2025-12-05 08:18:09'),
(13, 89, 9, 16, 1, '2025-12-03 08:45:00', NULL, NULL, 'ongoing', '2025-12-03 10:41:17', '2025-12-05 08:18:09'),
(14, 89, 10, 15, 1, '2025-12-03 09:00:00', NULL, NULL, 'ongoing', '2025-12-03 10:41:17', '2025-12-05 08:18:09'),
(15, 89, 6, 4, 1, '2025-12-03 09:15:00', NULL, NULL, 'ongoing', '2025-12-03 10:41:18', '2025-12-05 08:18:09'),
(16, 89, 8, 4, 1, '2025-12-03 08:30:00', NULL, NULL, 'ongoing', '2025-12-03 10:45:51', '2025-12-05 08:18:09'),
(17, 89, 10, 16, 1, '2025-12-03 08:45:00', NULL, NULL, 'ongoing', '2025-12-03 10:45:51', '2025-12-05 08:18:09'),
(18, 89, 9, 15, 1, '2025-12-03 09:00:00', NULL, NULL, 'ongoing', '2025-12-03 10:45:51', '2025-12-05 08:18:09'),
(19, 89, 12, 6, 1, '2025-12-03 09:15:00', NULL, NULL, 'ongoing', '2025-12-03 10:45:51', '2025-12-05 08:18:09'),
(20, 89, NULL, NULL, 2, '2025-12-03 09:30:00', NULL, NULL, 'upcoming', '2025-12-03 10:45:51', '2025-12-03 10:45:51'),
(21, 89, NULL, NULL, 2, '2025-12-03 09:30:00', NULL, NULL, 'upcoming', '2025-12-03 10:45:51', '2025-12-03 10:45:51'),
(22, 91, 12, 8, 1, '2025-12-04 07:36:00', '2025-12-06 00:47:19', 8, 'completed', '2025-12-03 17:41:07', '2025-12-05 11:47:19'),
(23, 91, 9, 4, 1, '2025-12-04 07:51:00', '2025-12-05 21:22:52', 4, 'completed', '2025-12-03 17:41:08', '2025-12-05 08:22:52'),
(24, 91, 4, 8, 2, '2025-12-04 08:36:00', '2025-12-06 00:50:58', 8, 'completed', '2025-12-03 17:41:09', '2025-12-05 11:50:58'),
(25, 104, 15, 12, 1, '2026-01-11 17:17:00', '2026-01-10 00:13:19', 12, 'completed', '2026-01-10 07:42:22', '2026-01-10 08:13:19'),
(26, 104, 16, 8, 1, '2026-01-11 17:32:00', '2026-01-09 23:57:43', 16, 'completed', '2026-01-10 07:42:22', '2026-01-10 07:57:43'),
(27, 104, 12, 16, 2, '2026-01-10 12:09:13', NULL, NULL, 'ongoing', '2026-01-10 07:42:22', '2026-01-10 20:09:43'),
(28, 106, 8, 16, 1, '2026-01-11 01:45:00', '2026-01-10 01:48:00', 8, 'completed', '2026-01-10 09:47:20', '2026-01-10 09:48:00'),
(29, 106, 12, 9, 1, '2026-01-11 02:00:00', '2026-01-10 01:48:31', 9, 'completed', '2026-01-10 09:47:35', '2026-01-10 09:48:31'),
(30, 106, 8, 9, 2, '2026-01-11 02:45:00', NULL, NULL, 'ongoing', '2026-01-10 09:47:35', '2026-01-12 02:49:09'),
(31, 107, 15, 12, 1, '2026-01-11 12:00:00', '2026-01-10 12:08:40', 12, 'completed', '2026-01-10 20:07:32', '2026-01-10 20:08:40'),
(32, 107, 9, 16, 1, '2026-01-11 12:15:00', '2026-01-10 12:10:48', 9, 'completed', '2026-01-10 20:07:32', '2026-01-10 20:10:48'),
(33, 107, 10, 17, 1, '2026-01-11 12:30:00', '2026-01-10 12:09:09', 17, 'completed', '2026-01-10 20:07:32', '2026-01-10 20:09:09'),
(34, 107, 8, 4, 1, '2026-01-11 12:45:00', '2026-01-10 12:07:46', 8, 'completed', '2026-01-10 20:07:32', '2026-01-10 20:07:46'),
(35, 107, 12, 9, 2, '2026-01-11 19:37:20', '2026-01-11 21:30:26', 12, 'completed', '2026-01-10 20:07:33', '2026-01-12 05:30:26'),
(36, 107, 17, 8, 2, '2026-01-11 19:37:21', '2026-01-11 21:30:59', 8, 'completed', '2026-01-10 20:07:33', '2026-01-12 05:30:59'),
(37, 108, 16, 17, 1, '2026-01-13 21:46:00', '2026-01-11 21:57:17', 16, 'completed', '2026-01-12 05:55:46', '2026-01-12 05:57:17'),
(38, 108, 10, 15, 1, '2026-01-13 22:01:00', '2026-01-11 21:57:46', 10, 'completed', '2026-01-12 05:55:46', '2026-01-12 05:57:46'),
(39, 108, 4, 9, 1, '2026-01-13 22:16:00', '2026-01-11 21:58:08', 4, 'completed', '2026-01-12 05:55:46', '2026-01-12 05:58:08'),
(40, 108, 8, 12, 1, '2026-01-13 22:31:00', '2026-01-11 21:58:51', 12, 'completed', '2026-01-12 05:55:46', '2026-01-12 05:58:51'),
(41, 108, 16, 10, 2, '2026-01-11 22:22:36', '2026-01-11 22:09:16', 16, 'completed', '2026-01-12 05:55:47', '2026-01-12 06:09:16'),
(42, 108, 4, 12, 2, '2026-01-11 22:22:36', '2026-01-11 22:08:29', 12, 'completed', '2026-01-12 05:55:47', '2026-01-12 06:08:29'),
(50, 109, 6, 8, 1, '2026-01-11 23:11:53', '2026-01-11 23:12:20', 8, 'completed', '2026-01-12 07:11:53', '2026-01-12 07:12:20'),
(51, 109, 15, 9, 1, '2026-01-11 23:11:53', '2026-01-11 23:13:12', 9, 'completed', '2026-01-12 07:11:53', '2026-01-12 07:13:12'),
(52, 109, 8, 9, 2, '2026-01-11 23:28:12', '2026-01-11 23:13:21', 9, 'completed', '2026-01-12 07:11:53', '2026-01-12 07:13:21'),
(53, 110, 4, 8, 1, '2026-01-13 23:44:00', '2026-01-11 23:50:00', 4, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:50:00'),
(54, 110, 17, 16, 1, '2026-01-13 23:59:00', '2026-01-11 23:50:36', 16, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:50:36'),
(55, 110, 15, 12, 1, '2026-01-14 00:14:00', '2026-01-11 23:50:59', 12, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:50:59'),
(56, 110, 6, 10, 1, '2026-01-14 00:29:00', '2026-01-11 23:51:30', 10, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:51:30'),
(57, 110, 4, 16, 2, '2026-01-12 00:05:36', '2026-01-11 23:52:37', 4, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:52:37'),
(58, 110, 12, 10, 2, '2026-01-12 00:06:32', '2026-01-11 23:51:58', 12, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:51:58'),
(59, 110, 4, 12, 3, '2026-01-12 00:07:37', '2026-01-11 23:52:46', 4, 'completed', '2026-01-12 07:49:20', '2026-01-12 07:52:46'),
(60, 111, 15, 7, 1, '2026-01-13 23:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(61, 111, 10, 16, 1, '2026-01-14 00:09:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(62, 111, 5, 12, 1, '2026-01-14 00:24:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(63, 111, 18, 14, 1, '2026-01-14 00:39:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(64, 111, 6, 11, 1, '2026-01-14 00:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(65, 111, 8, 9, 1, '2026-01-14 01:09:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(66, 111, 17, 3, 1, '2026-01-14 01:24:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(67, 111, 4, 1, 1, '2026-01-14 01:39:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(68, 111, NULL, NULL, 2, '2026-01-14 00:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(69, 111, NULL, NULL, 2, '2026-01-14 00:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(70, 111, NULL, NULL, 2, '2026-01-14 00:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(71, 111, NULL, NULL, 2, '2026-01-14 00:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(72, 111, NULL, NULL, 3, '2026-01-14 01:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(73, 111, NULL, NULL, 3, '2026-01-14 01:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27'),
(74, 111, NULL, NULL, 4, '2026-01-14 02:54:00', NULL, NULL, 'upcoming', '2026-01-12 08:07:27', '2026-01-12 08:07:27');

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

--
-- Dumping data for table `tournament_participants`
--

INSERT INTO `tournament_participants` (`id`, `tournament_id`, `user_id`, `group_id`, `status`, `created_at`, `updated_at`, `kills`, `squad_name`, `squad_id`) VALUES
(1, 1, 4, NULL, 'joined', '2025-07-03 09:12:47', '2025-07-03 09:12:47', 0, NULL, NULL),
(2, 2, 4, NULL, 'joined', '2025-07-03 10:00:31', '2025-07-03 10:00:31', 0, NULL, NULL),
(3, 3, 7, NULL, 'joined', '2025-07-06 02:10:17', '2025-07-06 02:10:17', 0, NULL, NULL),
(4, 4, 1, NULL, 'joined', '2025-07-06 02:12:22', '2025-07-06 02:12:22', 0, NULL, NULL),
(5, 4, 5, NULL, 'joined', '2025-07-06 02:13:40', '2025-07-06 02:13:40', 0, NULL, NULL),
(6, 4, 6, NULL, 'joined', '2025-07-06 02:14:20', '2025-07-06 02:14:20', 0, NULL, NULL),
(7, 4, 4, NULL, 'joined', '2025-07-06 02:15:04', '2025-07-06 02:15:04', 0, NULL, NULL),
(8, 5, 4, NULL, 'joined', '2025-07-06 02:53:31', '2025-07-06 02:53:31', 0, NULL, NULL),
(9, 5, 1, NULL, 'joined', '2025-07-06 02:54:25', '2025-07-06 02:54:25', 0, NULL, NULL),
(10, 5, 5, NULL, 'joined', '2025-07-06 02:56:38', '2025-07-06 02:56:38', 0, NULL, NULL),
(11, 6, 1, NULL, 'joined', '2025-07-07 19:56:59', '2025-07-07 19:56:59', 0, NULL, NULL),
(12, 6, 4, NULL, 'joined', '2025-07-07 19:59:51', '2025-07-07 19:59:51', 0, NULL, NULL),
(13, 6, 5, NULL, 'joined', '2025-07-07 20:03:41', '2025-07-07 20:03:41', 0, NULL, NULL),
(14, 6, 6, NULL, 'joined', '2025-07-07 20:04:36', '2025-07-07 20:04:36', 0, NULL, NULL),
(15, 7, 1, NULL, 'joined', '2025-07-18 05:05:22', '2025-07-18 05:05:22', 0, NULL, NULL),
(19, 11, 1, NULL, 'joined', '2025-07-18 05:45:31', '2025-07-18 05:45:31', 0, NULL, NULL),
(20, 12, 1, NULL, 'joined', '2025-07-18 06:25:34', '2025-07-18 06:25:34', 0, NULL, NULL),
(21, 5, 6, NULL, 'joined', '2025-07-20 19:02:42', '2025-07-20 19:02:42', 0, NULL, NULL),
(22, 5, 7, NULL, 'joined', '2025-07-20 19:04:06', '2025-07-20 19:04:06', 0, NULL, NULL),
(23, 13, 4, NULL, 'joined', '2025-07-21 15:54:08', '2025-07-21 15:54:08', 0, NULL, NULL),
(24, 14, 7, NULL, 'joined', '2025-07-21 22:00:31', '2025-07-21 22:00:31', 0, NULL, NULL),
(25, 14, 1, NULL, 'joined', '2025-07-25 14:45:52', '2025-07-25 14:45:52', 0, NULL, NULL),
(29, 16, 4, NULL, 'joined', '2025-07-29 06:28:28', '2025-07-29 06:28:28', 0, NULL, NULL),
(30, 16, 1, NULL, 'joined', '2025-07-29 06:28:28', '2025-07-29 06:28:28', 0, NULL, NULL),
(31, 16, 7, NULL, 'joined', '2025-07-29 06:28:28', '2025-07-29 06:28:28', 0, NULL, NULL),
(32, 17, 7, NULL, 'joined', '2025-07-29 17:29:50', '2025-07-29 17:29:50', 0, NULL, NULL),
(33, 17, 4, NULL, 'joined', '2025-07-29 17:29:50', '2025-07-31 13:24:38', 0, NULL, NULL),
(34, 20, 13, NULL, 'joined', '2025-07-31 13:01:06', '2025-07-31 13:01:06', 0, NULL, NULL),
(35, 22, 11, NULL, 'joined', '2025-07-31 13:31:01', '2025-07-31 13:31:01', 0, NULL, NULL),
(36, 22, 12, NULL, 'joined', '2025-07-31 13:31:01', '2025-07-31 13:31:01', 0, NULL, NULL),
(37, 22, 13, NULL, 'joined', '2025-07-31 13:31:01', '2025-07-31 13:31:01', 0, NULL, NULL),
(38, 23, 8, NULL, 'joined', '2025-08-02 01:17:07', '2025-08-02 01:17:07', 0, NULL, NULL),
(39, 23, 9, NULL, 'joined', '2025-08-02 01:17:07', '2025-08-02 01:17:07', 0, NULL, NULL),
(40, 23, 10, NULL, 'joined', '2025-08-02 01:17:07', '2025-08-02 01:17:07', 0, NULL, NULL),
(41, 23, 1, NULL, 'joined', '2025-08-02 02:26:59', '2025-08-02 02:26:59', 0, NULL, NULL),
(42, 20, 1, NULL, 'joined', '2025-08-02 02:33:13', '2025-08-02 02:33:13', 0, NULL, NULL),
(43, 23, 4, NULL, 'joined', '2025-08-02 02:39:58', '2025-08-02 02:39:58', 0, NULL, NULL),
(44, 20, 10, NULL, 'joined', '2025-08-02 18:24:31', '2025-08-02 18:24:31', 0, NULL, NULL),
(45, 20, 4, NULL, 'joined', '2025-08-02 18:26:08', '2025-08-02 18:26:08', 0, NULL, NULL),
(46, 24, 3, NULL, 'joined', '2025-08-22 23:32:56', '2025-08-22 23:32:56', 0, NULL, NULL),
(47, 24, 4, NULL, '', '2025-08-22 23:32:56', '2025-08-22 23:32:56', 0, NULL, NULL),
(48, 25, 3, NULL, 'joined', '2025-08-22 23:38:13', '2025-08-22 23:38:13', 0, NULL, NULL),
(49, 25, 11, NULL, 'joined', '2025-08-22 23:38:13', '2025-08-22 23:38:13', 0, NULL, NULL),
(50, 25, 12, NULL, 'joined', '2025-08-22 23:38:13', '2025-08-22 23:38:13', 0, NULL, NULL),
(51, 25, 13, NULL, 'joined', '2025-08-22 23:38:13', '2025-08-22 23:38:13', 0, NULL, NULL),
(52, 26, 1, NULL, 'joined', '2025-08-22 23:45:59', '2025-08-22 23:45:59', 0, NULL, NULL),
(53, 26, 4, NULL, 'joined', '2025-08-22 23:45:59', '2025-08-22 23:45:59', 0, NULL, NULL),
(54, 26, 12, NULL, 'joined', '2025-08-22 23:48:10', '2025-08-22 23:48:10', 0, NULL, NULL),
(55, 27, 9, NULL, 'joined', '2025-08-26 21:44:45', '2025-08-26 21:44:45', 0, NULL, NULL),
(56, 28, 9, NULL, 'joined', '2025-08-26 21:45:31', '2025-08-26 21:45:31', 0, NULL, NULL),
(57, 28, 8, NULL, '', '2025-08-26 21:45:31', '2025-08-26 21:45:31', 0, NULL, NULL),
(58, 28, 10, NULL, '', '2025-08-26 21:45:31', '2025-08-26 21:45:31', 0, NULL, NULL),
(59, 28, 12, NULL, 'joined', '2025-08-26 21:47:06', '2025-08-26 21:47:06', 0, NULL, NULL),
(60, 29, 11, NULL, 'joined', '2025-08-27 22:34:01', '2025-08-27 22:34:01', 0, NULL, NULL),
(61, 29, 3, NULL, '', '2025-08-27 22:34:01', '2025-08-27 22:34:01', 0, NULL, NULL),
(62, 29, 12, NULL, '', '2025-08-27 22:34:01', '2025-08-27 22:34:01', 0, NULL, NULL),
(63, 29, 13, NULL, '', '2025-08-27 22:34:02', '2025-08-27 22:34:02', 0, NULL, NULL),
(64, 30, 3, NULL, 'joined', '2025-08-27 23:01:42', '2025-08-27 23:01:42', 0, NULL, NULL),
(65, 30, 4, NULL, 'joined', '2025-08-28 00:50:23', '2025-08-28 00:50:23', 0, NULL, NULL),
(66, 31, 4, NULL, 'joined', '2025-08-28 00:51:11', '2025-08-28 00:51:11', 0, NULL, NULL),
(67, 32, 12, NULL, 'joined', '2025-08-28 01:28:43', '2025-08-28 01:28:43', 0, NULL, NULL),
(68, 32, 3, NULL, '', '2025-08-28 01:28:44', '2025-08-28 01:28:44', 0, NULL, NULL),
(69, 32, 11, NULL, '', '2025-08-28 01:28:44', '2025-08-28 01:28:44', 0, NULL, NULL),
(70, 32, 13, NULL, '', '2025-08-28 01:28:44', '2025-08-28 01:28:44', 0, NULL, NULL),
(71, 30, 7, NULL, 'joined', '2025-08-28 01:31:26', '2025-08-28 01:31:26', 0, NULL, NULL),
(72, 33, 3, NULL, 'joined', '2025-08-29 07:29:07', '2025-08-29 07:29:07', 0, NULL, NULL),
(73, 29, 5, 2, 'joined', '2025-09-06 00:41:40', '2025-09-06 00:41:40', 0, NULL, NULL),
(74, 34, 4, 3, 'joined', '2025-09-06 01:25:35', '2025-09-06 01:47:21', 0, NULL, NULL),
(75, 34, 1, NULL, '', '2025-09-06 01:25:35', '2025-09-06 01:25:35', 0, NULL, NULL),
(76, 34, 9, 4, 'joined', '2025-09-06 01:40:52', '2025-09-06 01:40:52', 0, NULL, NULL),
(77, 34, 12, 5, 'joined', '2025-09-06 01:45:21', '2025-09-06 01:45:21', 0, NULL, NULL),
(78, 34, 6, 2, 'joined', '2025-09-06 23:21:30', '2025-09-06 23:21:30', 0, NULL, NULL),
(79, 35, 3, NULL, 'joined', '2025-09-11 19:18:40', '2025-09-11 19:18:40', 0, NULL, NULL),
(80, 36, 4, NULL, 'joined', '2025-09-11 19:35:32', '2025-09-11 19:35:32', 0, NULL, NULL),
(81, 35, 4, NULL, 'joined', '2025-09-11 23:57:51', '2025-09-11 23:57:51', 0, NULL, NULL),
(82, 37, 4, NULL, 'joined', '2025-09-12 00:19:06', '2025-09-12 00:19:06', 0, NULL, NULL),
(83, 37, 12, NULL, 'joined', '2025-09-12 00:20:57', '2025-09-12 00:20:57', 0, NULL, NULL),
(84, 35, 12, NULL, 'joined', '2025-09-16 03:30:35', '2025-09-16 03:30:35', 0, NULL, NULL),
(85, 41, 4, NULL, 'joined', '2025-09-16 20:03:06', '2025-09-16 20:03:06', 0, NULL, NULL),
(86, 42, 9, NULL, 'joined', '2025-09-16 20:06:35', '2025-09-16 20:06:35', 0, NULL, NULL),
(87, 41, 9, NULL, 'joined', '2025-09-23 18:26:45', '2025-09-23 18:26:45', 0, NULL, NULL),
(88, 43, 9, NULL, 'joined', '2025-09-24 07:54:37', '2025-09-24 07:54:37', 0, NULL, NULL),
(89, 37, 9, NULL, 'joined', '2025-09-24 07:56:15', '2025-09-24 07:56:15', 0, NULL, NULL),
(90, 40, 9, NULL, 'joined', '2025-09-24 08:12:28', '2025-09-24 08:12:28', 0, NULL, NULL),
(91, 36, 9, NULL, 'joined', '2025-09-24 16:34:44', '2025-09-24 16:34:44', 0, NULL, NULL),
(92, 44, 4, 3, 'joined', '2025-09-26 16:34:23', '2025-09-26 16:34:23', 0, NULL, NULL),
(93, 45, 4, NULL, 'joined', '2025-09-26 16:37:53', '2025-09-26 16:37:53', 0, NULL, NULL),
(94, 46, 4, NULL, 'joined', '2025-09-26 16:39:02', '2025-09-26 16:39:02', 0, NULL, NULL),
(95, 47, 4, NULL, 'joined', '2025-09-26 16:40:49', '2025-09-26 16:40:49', 0, NULL, NULL),
(96, 48, 4, NULL, 'joined', '2025-09-26 16:44:18', '2025-09-26 16:44:18', 0, NULL, NULL),
(97, 49, 4, NULL, 'joined', '2025-09-26 16:45:53', '2025-09-26 16:45:53', 0, NULL, NULL),
(98, 50, 4, 3, 'joined', '2025-09-26 18:43:22', '2025-09-26 18:43:22', 0, NULL, NULL),
(99, 50, 1, 2, 'joined', '2025-09-26 21:10:16', '2025-09-26 21:10:16', 0, NULL, NULL),
(100, 50, 8, 4, 'joined', '2025-09-27 15:19:33', '2025-09-27 15:19:33', 0, NULL, NULL),
(101, 50, 11, 5, 'joined', '2025-09-27 15:25:45', '2025-09-27 15:25:45', 0, NULL, NULL),
(102, 35, 1, NULL, 'joined', '2025-09-28 11:36:25', '2025-09-28 11:36:25', 0, NULL, NULL),
(103, 41, 3, NULL, 'joined', '2025-09-28 11:42:24', '2025-09-28 11:42:24', 0, NULL, NULL),
(104, 51, 1, NULL, 'joined', '2025-10-01 21:39:33', '2025-10-01 21:39:33', 0, NULL, NULL),
(105, 51, 4, NULL, 'joined', '2025-10-01 21:47:27', '2025-10-01 21:47:27', 0, NULL, NULL),
(106, 51, 8, NULL, 'joined', '2025-10-02 09:48:34', '2025-10-02 09:48:34', 0, NULL, NULL),
(107, 51, 9, NULL, 'joined', '2025-10-02 09:54:07', '2025-10-02 09:54:07', 0, NULL, NULL),
(108, 51, 13, NULL, 'joined', '2025-10-02 09:56:21', '2025-10-02 09:56:21', 0, NULL, NULL),
(109, 51, 11, NULL, 'joined', '2025-10-02 09:57:40', '2025-10-02 09:57:40', 0, NULL, NULL),
(110, 51, 10, NULL, 'joined', '2025-10-02 09:58:48', '2025-10-02 09:58:48', 0, NULL, NULL),
(111, 51, 12, NULL, 'joined', '2025-10-02 10:00:17', '2025-10-02 10:00:17', 0, NULL, NULL),
(112, 51, 6, NULL, 'joined', '2025-10-02 10:02:14', '2025-10-02 10:02:14', 0, NULL, NULL),
(113, 51, 14, NULL, 'joined', '2025-10-02 10:03:15', '2025-10-02 10:03:15', 0, NULL, NULL),
(114, 52, 8, 4, 'joined', '2025-10-02 10:11:16', '2025-10-02 10:11:16', 0, NULL, NULL),
(115, 52, 4, 3, 'joined', '2025-10-02 10:15:01', '2025-10-02 10:15:01', 0, NULL, NULL),
(116, 52, 16, 7, 'joined', '2025-10-02 10:26:12', '2025-10-02 10:26:12', 0, NULL, NULL),
(117, 52, 15, 8, 'joined', '2025-10-02 10:28:53', '2025-10-02 10:28:53', 0, NULL, NULL),
(118, 53, 3, NULL, 'joined', '2025-10-02 10:38:02', '2025-10-02 10:38:02', 0, NULL, NULL),
(119, 54, 4, NULL, 'joined', '2025-10-03 07:36:52', '2025-10-03 07:36:52', 0, NULL, NULL),
(120, 55, 4, NULL, 'joined', '2025-10-03 08:23:04', '2025-10-03 08:23:04', 0, NULL, NULL),
(121, 56, 3, NULL, 'joined', '2025-10-03 22:02:27', '2025-10-03 22:02:27', 0, NULL, NULL),
(122, 57, 1, NULL, 'joined', '2025-10-04 09:25:52', '2025-10-04 09:25:52', 0, NULL, NULL),
(123, 57, 4, NULL, 'joined', '2025-10-04 10:53:55', '2025-10-04 10:53:55', 0, NULL, NULL),
(124, 57, 8, NULL, 'joined', '2025-10-04 10:57:49', '2025-10-04 10:57:49', 0, NULL, NULL),
(125, 57, 7, NULL, 'joined', '2025-10-04 10:59:01', '2025-10-04 10:59:01', 0, NULL, NULL),
(126, 57, 16, NULL, 'joined', '2025-10-04 11:00:02', '2025-10-04 11:00:02', 0, NULL, NULL),
(127, 57, 14, NULL, 'joined', '2025-10-04 11:00:53', '2025-10-04 11:00:53', 0, NULL, NULL),
(128, 57, 9, NULL, 'joined', '2025-10-04 11:01:37', '2025-10-04 11:01:37', 0, NULL, NULL),
(129, 57, 12, NULL, 'joined', '2025-10-04 11:02:59', '2025-10-04 11:02:59', 0, NULL, NULL),
(130, 58, 1, NULL, 'joined', '2025-10-04 12:40:30', '2025-10-04 12:40:30', 0, NULL, NULL),
(131, 58, 4, NULL, 'joined', '2025-10-04 12:41:37', '2025-10-04 12:41:37', 0, NULL, NULL),
(132, 58, 8, NULL, 'joined', '2025-10-04 12:42:19', '2025-10-04 12:42:19', 0, NULL, NULL),
(133, 58, 9, NULL, 'joined', '2025-10-04 12:42:56', '2025-10-04 12:42:56', 0, NULL, NULL),
(134, 58, 16, NULL, 'joined', '2025-10-04 12:43:45', '2025-10-04 12:43:45', 0, NULL, NULL),
(135, 58, 14, NULL, 'joined', '2025-10-04 12:47:11', '2025-10-04 12:47:11', 0, NULL, NULL),
(136, 58, 12, NULL, 'joined', '2025-10-04 12:50:31', '2025-10-04 12:50:31', 0, NULL, NULL),
(137, 58, 7, NULL, 'joined', '2025-10-04 13:26:53', '2025-10-04 13:26:53', 0, NULL, NULL),
(138, 59, 1, NULL, 'joined', '2025-10-05 11:24:20', '2025-10-05 11:24:20', 0, NULL, NULL),
(139, 59, 4, NULL, 'joined', '2025-10-05 11:26:02', '2025-10-05 11:26:02', 0, NULL, NULL),
(140, 59, 8, NULL, 'joined', '2025-10-05 11:26:46', '2025-10-05 11:26:46', 0, NULL, NULL),
(141, 59, 12, NULL, 'joined', '2025-10-05 11:27:25', '2025-10-05 11:27:25', 0, NULL, NULL),
(142, 60, 4, NULL, 'joined', '2025-10-05 20:14:32', '2025-10-05 20:14:32', 0, NULL, NULL),
(143, 60, 1, NULL, 'joined', '2025-10-05 20:15:38', '2025-10-05 20:15:38', 0, NULL, NULL),
(144, 60, 14, NULL, 'joined', '2025-10-05 20:16:14', '2025-10-05 20:16:14', 0, NULL, NULL),
(145, 60, 16, NULL, 'joined', '2025-10-05 20:17:01', '2025-10-05 20:17:01', 0, NULL, NULL),
(146, 61, 4, NULL, 'joined', '2025-10-05 20:27:45', '2025-10-05 20:27:45', 0, NULL, NULL),
(147, 61, 1, NULL, 'joined', '2025-10-05 20:28:37', '2025-10-05 20:28:37', 0, NULL, NULL),
(148, 61, 8, NULL, 'joined', '2025-10-05 20:29:10', '2025-10-05 20:29:10', 0, NULL, NULL),
(149, 61, 12, NULL, 'joined', '2025-10-05 20:29:53', '2025-10-05 20:29:53', 0, NULL, NULL),
(150, 62, 4, NULL, 'joined', '2025-10-06 08:07:04', '2025-10-06 08:07:04', 0, NULL, NULL),
(151, 62, 1, NULL, 'joined', '2025-10-06 08:26:48', '2025-10-06 08:26:48', 0, NULL, NULL),
(152, 62, 8, NULL, 'joined', '2025-10-06 08:27:26', '2025-10-06 08:27:26', 0, NULL, NULL),
(153, 62, 12, NULL, 'joined', '2025-10-06 08:28:06', '2025-10-06 08:28:06', 0, NULL, NULL),
(154, 63, 4, NULL, 'joined', '2025-10-06 09:12:15', '2025-10-06 09:12:15', 0, NULL, NULL),
(155, 63, 1, NULL, 'joined', '2025-10-06 09:13:27', '2025-10-06 09:13:27', 0, NULL, NULL),
(156, 63, 12, NULL, 'joined', '2025-10-06 09:14:14', '2025-10-06 09:14:14', 0, NULL, NULL),
(157, 63, 8, NULL, 'joined', '2025-10-06 09:17:23', '2025-10-06 09:17:23', 0, NULL, NULL),
(158, 64, 4, NULL, 'joined', '2025-10-06 11:10:56', '2025-10-06 11:10:56', 0, NULL, NULL),
(159, 64, 1, NULL, 'joined', '2025-10-06 11:12:02', '2025-10-06 11:12:02', 0, NULL, NULL),
(160, 64, 14, NULL, 'joined', '2025-10-06 11:12:42', '2025-10-06 11:12:42', 0, NULL, NULL),
(161, 64, 12, NULL, 'joined', '2025-10-06 11:13:20', '2025-10-06 11:13:20', 0, NULL, NULL),
(162, 65, 8, NULL, 'joined', '2025-10-06 15:42:10', '2025-10-06 15:42:10', 0, NULL, NULL),
(163, 65, 12, NULL, 'joined', '2025-10-06 15:43:18', '2025-10-06 15:43:18', 0, NULL, NULL),
(164, 65, 9, NULL, 'joined', '2025-10-06 15:43:57', '2025-10-06 15:43:57', 0, NULL, NULL),
(165, 65, 1, NULL, 'joined', '2025-10-06 15:44:43', '2025-10-06 15:44:43', 0, NULL, NULL),
(166, 66, 8, NULL, 'joined', '2025-10-06 16:31:38', '2025-10-06 16:31:38', 0, NULL, NULL),
(167, 66, 4, NULL, 'joined', '2025-10-06 16:32:32', '2025-10-06 16:32:32', 0, NULL, NULL),
(168, 66, 1, NULL, 'joined', '2025-10-06 16:33:08', '2025-10-06 16:33:08', 0, NULL, NULL),
(169, 66, 9, NULL, 'joined', '2025-10-06 16:33:44', '2025-10-06 16:33:44', 0, NULL, NULL),
(170, 67, 8, NULL, 'joined', '2025-10-07 08:26:01', '2025-10-07 08:26:01', 0, NULL, NULL),
(171, 67, 4, NULL, 'joined', '2025-10-07 08:27:15', '2025-10-07 08:27:15', 0, NULL, NULL),
(172, 67, 1, NULL, 'joined', '2025-10-07 08:28:19', '2025-10-07 08:28:19', 0, NULL, NULL),
(173, 67, 16, NULL, 'joined', '2025-10-07 08:29:02', '2025-10-07 08:29:02', 0, NULL, NULL),
(174, 68, 8, NULL, 'joined', '2025-10-07 12:56:40', '2025-10-07 12:56:40', 0, NULL, NULL),
(175, 68, 1, NULL, 'joined', '2025-10-07 12:57:43', '2025-10-07 12:57:43', 0, NULL, NULL),
(176, 68, 4, NULL, 'joined', '2025-10-07 12:58:29', '2025-10-07 12:58:29', 0, NULL, NULL),
(177, 68, 9, NULL, 'joined', '2025-10-07 12:59:13', '2025-10-07 12:59:13', 0, NULL, NULL),
(178, 69, 4, NULL, 'joined', '2025-10-07 13:28:10', '2025-10-07 13:28:10', 0, NULL, NULL),
(179, 69, 1, NULL, 'joined', '2025-10-07 13:57:55', '2025-10-07 13:57:55', 0, NULL, NULL),
(180, 69, 9, NULL, 'joined', '2025-10-07 13:58:54', '2025-10-07 13:58:54', 0, NULL, NULL),
(181, 69, 8, NULL, 'joined', '2025-10-07 13:59:38', '2025-10-07 13:59:38', 0, NULL, NULL),
(182, 70, 4, NULL, 'joined', '2025-10-11 20:21:57', '2025-10-11 20:21:57', 0, NULL, NULL),
(183, 70, 8, NULL, 'joined', '2025-10-11 20:24:34', '2025-10-11 20:24:34', 0, NULL, NULL),
(184, 70, 1, NULL, 'joined', '2025-10-11 20:26:46', '2025-10-11 20:26:46', 0, NULL, NULL),
(185, 70, 9, NULL, 'joined', '2025-10-11 20:29:01', '2025-10-11 20:29:01', 0, NULL, NULL),
(186, 71, 4, NULL, 'joined', '2025-10-12 12:28:45', '2025-10-12 12:28:45', 0, NULL, NULL),
(187, 71, 1, NULL, 'joined', '2025-10-12 12:29:37', '2025-10-12 12:29:37', 0, NULL, NULL),
(188, 71, 9, NULL, 'joined', '2025-10-12 12:30:33', '2025-10-12 12:30:33', 0, NULL, NULL),
(189, 71, 12, NULL, 'joined', '2025-10-12 12:31:09', '2025-10-12 12:31:09', 0, NULL, NULL),
(190, 72, 4, 3, 'joined', '2025-10-21 17:09:51', '2025-10-21 17:09:51', 0, NULL, NULL),
(191, 72, 15, 8, 'joined', '2025-10-21 17:14:03', '2025-10-21 17:14:03', 0, NULL, NULL),
(192, 72, 14, 6, 'joined', '2025-10-21 17:20:15', '2025-10-21 17:20:15', 0, NULL, NULL),
(193, 72, 11, 5, 'joined', '2025-10-21 17:21:50', '2025-10-21 17:21:50', 0, NULL, NULL),
(195, 74, 1, NULL, 'joined', '2025-10-28 14:05:42', '2025-10-28 14:05:42', 0, NULL, NULL),
(196, 75, 1, NULL, 'joined', '2025-10-28 14:08:26', '2025-10-28 14:08:26', 0, NULL, NULL),
(197, 76, 1, NULL, 'joined', '2025-10-28 14:10:03', '2025-10-28 14:10:03', 0, NULL, NULL),
(198, 77, 1, NULL, 'joined', '2025-10-28 14:14:10', '2025-10-28 14:14:10', 0, NULL, NULL),
(199, 78, 1, 2, 'joined', '2025-10-28 14:19:58', '2025-10-28 14:19:58', 0, NULL, NULL),
(200, 76, 15, NULL, 'joined', '2025-10-31 15:09:43', '2025-10-31 15:09:43', 0, NULL, NULL),
(201, 76, 4, NULL, 'joined', '2025-10-31 15:11:35', '2025-10-31 15:11:35', 0, NULL, NULL),
(202, 74, 4, NULL, 'joined', '2025-10-31 15:13:06', '2025-10-31 15:13:06', 0, NULL, NULL),
(203, 79, 4, NULL, 'joined', '2025-10-31 15:18:07', '2025-10-31 15:18:07', 0, NULL, NULL),
(204, 80, 4, 3, 'joined', '2025-10-31 15:39:54', '2025-10-31 15:39:54', 0, NULL, NULL),
(205, 80, 15, 8, 'joined', '2025-10-31 15:47:08', '2025-10-31 15:47:08', 0, NULL, NULL),
(206, 81, 1, 2, 'joined', '2025-10-31 15:56:34', '2025-10-31 15:56:34', 0, NULL, NULL),
(207, 82, 1, NULL, 'joined', '2025-11-01 13:59:07', '2025-11-01 13:59:07', 0, NULL, NULL),
(208, 83, 1, NULL, 'joined', '2025-11-01 14:04:51', '2025-11-01 14:04:51', 0, NULL, NULL),
(209, 84, 1, 2, 'joined', '2025-11-08 21:47:38', '2025-11-08 21:47:38', 0, NULL, NULL),
(211, 86, 3, NULL, 'joined', '2025-11-12 08:39:37', '2025-11-12 08:39:37', 0, NULL, NULL),
(212, 86, 4, NULL, 'joined', '2025-11-12 08:44:02', '2025-11-12 08:44:02', 0, NULL, NULL),
(213, 86, 1, NULL, 'joined', '2025-11-12 08:45:11', '2025-11-12 08:45:11', 0, NULL, NULL),
(214, 86, 16, NULL, 'joined', '2025-11-12 09:30:08', '2025-11-12 09:30:08', 0, NULL, NULL),
(215, 86, 15, NULL, 'joined', '2025-11-12 09:31:43', '2025-11-12 09:31:43', 0, NULL, NULL),
(216, 86, 6, NULL, 'joined', '2025-11-12 09:36:17', '2025-11-12 09:36:17', 0, NULL, NULL),
(217, 86, 14, NULL, 'joined', '2025-11-12 09:39:07', '2025-11-12 09:39:07', 0, NULL, NULL),
(218, 86, 12, NULL, 'joined', '2025-11-12 09:43:51', '2025-11-12 09:43:51', 0, NULL, NULL),
(219, 87, 3, NULL, 'joined', '2025-11-13 07:43:14', '2025-11-13 07:43:14', 0, NULL, NULL),
(220, 87, 4, NULL, 'joined', '2025-11-13 18:00:45', '2025-11-13 18:00:45', 0, NULL, NULL),
(221, 87, 1, NULL, 'joined', '2025-11-13 18:01:55', '2025-11-13 18:01:55', 0, NULL, NULL),
(222, 87, 16, NULL, 'joined', '2025-11-13 18:02:42', '2025-11-13 18:02:42', 0, NULL, NULL),
(223, 87, 14, NULL, 'joined', '2025-11-13 18:03:50', '2025-11-13 18:03:50', 0, NULL, NULL),
(224, 87, 15, NULL, 'joined', '2025-11-13 18:05:23', '2025-11-13 18:05:23', 0, NULL, NULL),
(225, 87, 12, NULL, 'joined', '2025-11-13 18:07:17', '2025-11-13 18:07:17', 0, NULL, NULL),
(226, 87, 11, NULL, 'joined', '2025-11-13 18:08:23', '2025-11-13 18:08:23', 0, NULL, NULL),
(227, 88, 4, NULL, 'joined', '2025-12-01 20:23:50', '2025-12-01 20:23:50', 0, NULL, NULL),
(228, 89, 4, NULL, 'joined', '2025-12-01 20:24:46', '2025-12-01 20:24:46', 0, NULL, NULL),
(229, 89, 6, NULL, 'joined', '2025-12-02 21:33:10', '2025-12-02 21:33:10', 0, NULL, NULL),
(230, 89, 16, NULL, 'joined', '2025-12-02 21:34:49', '2025-12-02 21:34:49', 0, NULL, NULL),
(231, 89, 8, NULL, 'joined', '2025-12-02 21:35:53', '2025-12-02 21:35:53', 0, NULL, NULL),
(232, 89, 9, NULL, 'joined', '2025-12-02 21:37:19', '2025-12-02 21:37:19', 0, NULL, NULL),
(233, 89, 15, NULL, 'joined', '2025-12-02 21:41:28', '2025-12-02 21:41:28', 0, NULL, NULL),
(234, 89, 10, NULL, 'joined', '2025-12-02 21:45:01', '2025-12-02 21:45:01', 0, NULL, NULL),
(235, 89, 12, NULL, 'joined', '2025-12-02 21:45:49', '2025-12-02 21:45:49', 0, NULL, NULL),
(236, 91, 8, NULL, 'joined', '2025-12-03 17:37:29', '2025-12-03 17:37:29', 0, NULL, NULL),
(237, 91, 9, NULL, 'joined', '2025-12-03 17:37:54', '2025-12-03 17:37:54', 0, NULL, NULL),
(238, 91, 12, NULL, 'joined', '2025-12-03 17:38:25', '2025-12-03 17:38:25', 0, NULL, NULL),
(239, 91, 4, NULL, 'joined', '2025-12-03 17:40:49', '2025-12-03 17:40:49', 0, NULL, NULL),
(242, 98, 8, 4, 'joined', '2026-01-06 05:52:47', '2026-01-06 05:52:47', 0, NULL, NULL),
(243, 98, 9, 4, 'joined', '2026-01-06 05:52:47', '2026-01-06 05:52:47', 0, NULL, NULL),
(244, 98, 3, 5, 'joined', '2026-01-06 06:17:04', '2026-01-06 06:17:04', 0, NULL, NULL),
(245, 98, 11, 5, 'joined', '2026-01-06 06:17:04', '2026-01-06 06:17:04', 0, NULL, NULL),
(246, 98, 12, 5, 'joined', '2026-01-06 06:17:04', '2026-01-06 06:17:04', 0, NULL, NULL),
(247, 98, 13, 5, 'joined', '2026-01-06 06:17:04', '2026-01-06 06:17:04', 0, NULL, NULL),
(248, 98, 1, 3, 'joined', '2026-01-06 15:26:12', '2026-01-06 15:26:12', 0, NULL, NULL),
(249, 98, 4, 3, 'joined', '2026-01-06 15:26:12', '2026-01-06 15:26:12', 0, NULL, NULL),
(250, 98, 7, 3, 'joined', '2026-01-06 15:26:12', '2026-01-06 15:26:12', 0, NULL, NULL),
(251, 98, 10, 3, 'joined', '2026-01-06 15:26:12', '2026-01-06 15:26:12', 0, NULL, NULL),
(252, 98, 15, 8, 'joined', '2026-01-06 15:38:36', '2026-01-06 15:38:36', 0, NULL, NULL),
(253, 99, 3, NULL, 'joined', '2026-01-07 04:44:15', '2026-01-07 04:44:15', 0, NULL, NULL),
(254, 100, 3, NULL, 'joined', '2026-01-07 05:01:59', '2026-01-07 05:01:59', 0, NULL, NULL),
(255, 100, 15, NULL, 'joined', '2026-01-07 05:02:28', '2026-01-07 05:02:28', 0, NULL, NULL),
(256, 100, 12, NULL, 'joined', '2026-01-07 05:02:57', '2026-01-07 05:02:57', 0, NULL, NULL),
(257, 100, 8, NULL, 'joined', '2026-01-07 05:03:10', '2026-01-07 05:03:10', 0, NULL, NULL),
(258, 100, 16, NULL, 'joined', '2026-01-07 05:03:46', '2026-01-07 05:03:46', 0, NULL, NULL),
(259, 100, 4, NULL, 'joined', '2026-01-07 05:04:06', '2026-01-07 05:04:06', 0, NULL, NULL),
(260, 100, 6, NULL, 'joined', '2026-01-07 05:05:42', '2026-01-07 05:05:42', 0, NULL, NULL),
(261, 101, 8, NULL, 'joined', '2026-01-07 05:21:07', '2026-01-07 05:21:07', 0, NULL, NULL),
(262, 102, 15, 8, 'joined', '2026-01-07 18:36:21', '2026-01-07 18:36:21', 0, 'gradust@gmail.com', NULL),
(263, 103, 3, NULL, 'joined', '2026-01-08 17:32:42', '2026-01-08 17:32:42', 0, NULL, NULL),
(264, 103, 8, NULL, 'joined', '2026-01-08 17:34:07', '2026-01-08 17:34:07', 0, NULL, NULL),
(265, 103, 9, NULL, 'joined', '2026-01-08 17:34:18', '2026-01-08 17:34:18', 0, NULL, NULL),
(266, 103, 16, NULL, 'joined', '2026-01-08 17:34:37', '2026-01-08 17:34:37', 0, NULL, NULL),
(267, 102, 1, 3, 'joined', '2026-01-09 00:13:16', '2026-01-09 00:13:16', 0, NULL, NULL),
(268, 102, 4, 3, 'joined', '2026-01-09 00:13:16', '2026-01-09 00:13:16', 0, NULL, NULL),
(269, 102, 7, 3, 'joined', '2026-01-09 00:13:16', '2026-01-09 00:13:16', 0, NULL, NULL),
(270, 102, 10, 3, 'joined', '2026-01-09 00:13:16', '2026-01-09 00:13:16', 0, NULL, NULL),
(271, 102, 8, 6, 'joined', '2026-01-09 00:18:09', '2026-01-09 00:18:09', 0, NULL, NULL),
(272, 102, 14, 6, 'joined', '2026-01-09 00:18:09', '2026-01-09 00:18:09', 0, NULL, NULL),
(273, 102, 18, 6, 'joined', '2026-01-09 00:18:09', '2026-01-09 00:18:09', 0, NULL, NULL),
(274, 104, 8, NULL, 'joined', '2026-01-10 01:19:06', '2026-01-10 01:19:06', 0, NULL, NULL),
(275, 104, 12, NULL, 'joined', '2026-01-10 03:53:12', '2026-01-10 03:53:12', 0, NULL, NULL),
(276, 104, 16, NULL, 'joined', '2026-01-10 03:54:56', '2026-01-10 03:54:56', 0, NULL, NULL),
(277, 104, 15, NULL, 'joined', '2026-01-10 03:55:25', '2026-01-10 03:55:25', 0, NULL, NULL),
(278, 105, 8, NULL, 'joined', '2026-01-10 09:43:56', '2026-01-10 09:43:56', 0, NULL, NULL),
(279, 106, 8, NULL, 'joined', '2026-01-10 09:45:55', '2026-01-10 09:45:55', 0, NULL, NULL),
(280, 106, 9, NULL, 'joined', '2026-01-10 09:46:35', '2026-01-10 09:46:35', 0, NULL, NULL),
(281, 106, 12, NULL, 'joined', '2026-01-10 09:46:49', '2026-01-10 09:46:49', 0, NULL, NULL),
(282, 106, 16, NULL, 'joined', '2026-01-10 09:47:00', '2026-01-10 09:47:00', 0, NULL, NULL),
(283, 107, 8, NULL, 'joined', '2026-01-10 20:00:44', '2026-01-10 20:00:44', 0, NULL, NULL),
(284, 107, 10, NULL, 'joined', '2026-01-10 20:04:14', '2026-01-10 20:04:14', 0, NULL, NULL),
(285, 107, 15, NULL, 'joined', '2026-01-10 20:04:55', '2026-01-10 20:04:55', 0, NULL, NULL),
(286, 107, 12, NULL, 'joined', '2026-01-10 20:05:09', '2026-01-10 20:05:09', 0, NULL, NULL),
(287, 107, 4, NULL, 'joined', '2026-01-10 20:05:27', '2026-01-10 20:05:27', 0, NULL, NULL),
(288, 107, 9, NULL, 'joined', '2026-01-10 20:05:54', '2026-01-10 20:05:54', 0, NULL, NULL),
(289, 107, 17, NULL, 'joined', '2026-01-10 20:06:15', '2026-01-10 20:06:15', 0, NULL, NULL),
(290, 107, 16, NULL, 'joined', '2026-01-10 20:06:36', '2026-01-10 20:06:36', 0, NULL, NULL),
(291, 108, 8, NULL, 'joined', '2026-01-12 05:47:42', '2026-01-12 05:47:42', 0, NULL, NULL),
(292, 108, 10, NULL, 'joined', '2026-01-12 05:50:08', '2026-01-12 05:50:08', 0, NULL, NULL),
(293, 108, 15, NULL, 'joined', '2026-01-12 05:50:23', '2026-01-12 05:50:23', 0, NULL, NULL),
(294, 108, 12, NULL, 'joined', '2026-01-12 05:50:39', '2026-01-12 05:50:39', 0, NULL, NULL),
(295, 108, 4, NULL, 'joined', '2026-01-12 05:52:00', '2026-01-12 05:52:00', 0, NULL, NULL),
(296, 108, 9, NULL, 'joined', '2026-01-12 05:52:16', '2026-01-12 05:52:16', 0, NULL, NULL),
(297, 108, 17, NULL, 'joined', '2026-01-12 05:52:58', '2026-01-12 05:52:58', 0, NULL, NULL),
(298, 108, 16, NULL, 'joined', '2026-01-12 05:53:38', '2026-01-12 05:53:38', 0, NULL, NULL),
(299, 109, 8, NULL, 'joined', '2026-01-12 06:21:56', '2026-01-12 06:21:56', 0, NULL, NULL),
(300, 109, 10, NULL, 'joined', '2026-01-12 06:22:30', '2026-01-12 06:22:30', 0, NULL, NULL),
(301, 109, 15, NULL, 'joined', '2026-01-12 06:22:44', '2026-01-12 06:22:44', 0, NULL, NULL),
(302, 109, 12, NULL, 'joined', '2026-01-12 06:23:03', '2026-01-12 06:23:03', 0, NULL, NULL),
(303, 109, 4, NULL, 'joined', '2026-01-12 06:23:16', '2026-01-12 06:23:16', 0, NULL, NULL),
(304, 109, 9, NULL, 'joined', '2026-01-12 06:23:28', '2026-01-12 06:23:28', 0, NULL, NULL),
(305, 109, 16, NULL, 'joined', '2026-01-12 06:23:56', '2026-01-12 06:23:56', 0, NULL, NULL),
(306, 109, 6, NULL, 'joined', '2026-01-12 06:24:09', '2026-01-12 06:24:09', 0, NULL, NULL),
(307, 110, 8, NULL, 'joined', '2026-01-12 07:44:46', '2026-01-12 07:44:46', 0, NULL, NULL),
(308, 110, 10, NULL, 'joined', '2026-01-12 07:45:02', '2026-01-12 07:45:02', 0, NULL, NULL),
(309, 110, 15, NULL, 'joined', '2026-01-12 07:45:17', '2026-01-12 07:45:17', 0, NULL, NULL),
(310, 110, 12, NULL, 'joined', '2026-01-12 07:46:39', '2026-01-12 07:46:39', 0, NULL, NULL),
(311, 110, 6, NULL, 'joined', '2026-01-12 07:47:31', '2026-01-12 07:47:31', 0, NULL, NULL),
(312, 110, 17, NULL, 'joined', '2026-01-12 07:47:44', '2026-01-12 07:47:44', 0, NULL, NULL),
(313, 110, 16, NULL, 'joined', '2026-01-12 07:48:08', '2026-01-12 07:48:08', 0, NULL, NULL),
(314, 110, 4, NULL, 'joined', '2026-01-12 07:48:32', '2026-01-12 07:48:32', 0, NULL, NULL),
(315, 111, 8, NULL, 'joined', '2026-01-12 07:55:06', '2026-01-12 07:55:06', 0, NULL, NULL),
(316, 111, 6, NULL, 'joined', '2026-01-12 07:55:42', '2026-01-12 07:55:42', 0, NULL, NULL),
(317, 111, 17, NULL, 'joined', '2026-01-12 07:56:18', '2026-01-12 07:56:18', 0, NULL, NULL),
(318, 111, 16, NULL, 'joined', '2026-01-12 07:56:31', '2026-01-12 07:56:31', 0, NULL, NULL),
(319, 111, 9, NULL, 'joined', '2026-01-12 07:56:56', '2026-01-12 07:56:56', 0, NULL, NULL),
(320, 111, 4, NULL, 'joined', '2026-01-12 07:57:33', '2026-01-12 07:57:33', 0, NULL, NULL),
(321, 111, 12, NULL, 'joined', '2026-01-12 07:57:57', '2026-01-12 07:57:57', 0, NULL, NULL),
(322, 111, 15, NULL, 'joined', '2026-01-12 07:58:12', '2026-01-12 07:58:12', 0, NULL, NULL),
(323, 111, 10, NULL, 'joined', '2026-01-12 07:58:24', '2026-01-12 07:58:24', 0, NULL, NULL),
(324, 111, 3, NULL, 'joined', '2026-01-12 07:59:02', '2026-01-12 07:59:02', 0, NULL, NULL),
(325, 111, 14, NULL, 'joined', '2026-01-12 07:59:49', '2026-01-12 07:59:49', 0, NULL, NULL),
(326, 111, 1, NULL, 'joined', '2026-01-12 08:02:14', '2026-01-12 08:02:14', 0, NULL, NULL),
(327, 111, 5, NULL, 'joined', '2026-01-12 08:04:16', '2026-01-12 08:04:16', 0, NULL, NULL),
(328, 111, 7, NULL, 'joined', '2026-01-12 08:05:18', '2026-01-12 08:05:18', 0, NULL, NULL),
(329, 111, 11, NULL, 'joined', '2026-01-12 08:05:56', '2026-01-12 08:05:56', 0, NULL, NULL),
(330, 111, 18, NULL, 'joined', '2026-01-12 08:06:54', '2026-01-12 08:06:54', 0, NULL, NULL);

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

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `amount`, `currency`, `type`, `status`, `reference`, `external_reference`, `withdrawal_details`, `description`, `payment_gateway`, `gateway_reference`, `account_details`, `created_at`, `completed_at`, `updated_at`) VALUES
(2, 3, 500.00, 'NGN', 'deposit', 'pending', 'FIXED-1759081236-68d9731497e24', NULL, NULL, 'Test after table fix', NULL, NULL, NULL, '2025-09-28 17:40:36', NULL, '2025-09-28 17:40:36'),
(3, 3, 1000.00, 'NGN', 'deposit', 'pending', 'FINAL-1759081307-68d9735bd4c28', NULL, NULL, 'Final system test', NULL, NULL, NULL, '2025-09-28 17:41:47', NULL, '2025-09-28 17:41:47'),
(4, 4, 500.00, 'NGN', 'deposit', 'pending', 'XTX-1759081334-d4127d1c', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-28 17:42:14', NULL, '2025-09-28 17:42:14'),
(5, 4, 500.00, 'NGN', 'deposit', 'pending', 'XTX-1759081808-84b48a2c', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-28 17:50:08', NULL, '2025-09-28 17:50:08'),
(6, 4, 1000.00, 'NGN', 'deposit', 'pending', 'XTX-1759142472-d4622d73', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-29 10:41:12', NULL, '2025-09-29 10:41:12'),
(7, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759247249-1db5ab5b', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 15:47:29', NULL, '2025-09-30 15:47:29'),
(8, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759248481-8534cb7c', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 16:08:01', NULL, '2025-09-30 16:08:01'),
(9, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759248749-973d8909', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 16:12:29', NULL, '2025-09-30 16:12:29'),
(10, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759249196-b19cc5f4', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 16:19:56', NULL, '2025-09-30 16:19:56'),
(11, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759249210-762a7cc9', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 16:20:10', NULL, '2025-09-30 16:20:10'),
(12, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759249461-6cf83e7e', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 16:24:21', NULL, '2025-09-30 16:24:21'),
(13, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759250072-37cf847f', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-09-30 16:34:32', NULL, '2025-09-30 16:34:32'),
(14, 4, 700.00, 'NGN', 'deposit', 'failed', 'XTX-1759311172-6d0ae4e4', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 09:32:52', NULL, '2025-10-01 09:33:09'),
(15, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759311411-662db19e', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 09:36:51', NULL, '2025-10-01 09:36:51'),
(16, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759311599-a9d9f895', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 09:39:59', NULL, '2025-10-01 09:39:59'),
(17, 4, 700.00, 'NGN', 'deposit', 'completed', 'XTX-1759312268-4734ce89', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 09:51:08', NULL, '2025-10-01 09:51:58'),
(18, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759312364-a7975967', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 09:52:44', NULL, '2025-10-01 09:52:44'),
(19, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759312847-7a609967', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 10:00:47', NULL, '2025-10-01 10:00:47'),
(20, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759313420-e8874fa6', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 10:10:20', NULL, '2025-10-01 10:10:20'),
(21, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759313774-b224b82b', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 10:16:14', NULL, '2025-10-01 10:16:14'),
(22, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759351164-47a52e60', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 20:39:24', NULL, '2025-10-01 20:39:24'),
(23, 4, 700.00, 'NGN', 'deposit', 'pending', 'XTX-1759351423-33d093af', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 20:43:43', NULL, '2025-10-01 20:43:43'),
(24, 1, 2000.00, 'NGN', 'deposit', 'completed', 'XTX-1759351677-e19cb5b7', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 20:47:57', NULL, '2025-10-01 20:47:59'),
(25, 1, 700000.00, 'NGN', 'deposit', 'completed', 'XTX-1759351710-30ee59d4', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 20:48:30', NULL, '2025-10-01 20:48:35'),
(26, 4, 9000.00, 'NGN', 'deposit', 'completed', 'XTX-1759355145-d5cd6841', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-01 21:45:45', NULL, '2025-10-01 21:45:51'),
(27, 8, 3000.00, 'NGN', 'deposit', 'completed', 'XTX-1759398474-79bb82c9', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 09:47:54', NULL, '2025-10-02 09:48:00'),
(28, 9, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759398812-ca3252ea', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 09:53:32', NULL, '2025-10-02 09:53:36'),
(29, 13, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759398941-4351a42f', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 09:55:41', NULL, '2025-10-02 09:55:44'),
(30, 11, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759399036-64bb8bb3', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 09:57:16', NULL, '2025-10-02 09:57:19'),
(31, 10, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759399105-c825da8f', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 09:58:25', NULL, '2025-10-02 09:58:28'),
(32, 12, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759399169-b86da9d3', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 09:59:29', NULL, '2025-10-02 09:59:33'),
(33, 6, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759399312-fdf36dcc', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 10:01:52', NULL, '2025-10-02 10:01:55'),
(34, 14, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1759399366-e8effc3e', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 10:02:46', NULL, '2025-10-02 10:02:50'),
(35, 8, 100000.00, 'NGN', 'winning', 'completed', 'WIN-1759399772-51', NULL, NULL, 'Tournament winnings: freeforall Tournament - Oct 1', NULL, NULL, NULL, '2025-10-02 10:09:32', NULL, '2025-10-02 10:09:32'),
(36, 16, 7000.00, 'NGN', 'deposit', 'completed', 'XTX-1759400748-8d568d6e', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 10:25:48', NULL, '2025-10-02 10:25:51'),
(37, 15, 7000.00, 'NGN', 'deposit', 'completed', 'XTX-1759400906-a576c20e', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 10:28:26', NULL, '2025-10-02 10:28:29'),
(38, 4, 18000.00, 'NGN', 'winning', 'completed', 'SQUAD-WIN-1759401042-52', NULL, NULL, 'Squad tournament winnings: Squad Tournament - Oct 2', NULL, NULL, NULL, '2025-10-02 10:30:42', NULL, '2025-10-02 10:30:42'),
(39, 3, 200000.00, 'NGN', 'deposit', 'completed', 'XTX-1759401336-bd03e7c1', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-02 10:35:36', NULL, '2025-10-02 10:35:40'),
(40, 1, 700.00, 'NGN', 'deposit', 'completed', 'XTX-1759565465-e58e1751', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-04 08:11:05', NULL, '2025-10-09 14:24:53'),
(41, 7, 3000.00, 'NGN', 'deposit', 'completed', 'XTX-1759575523-98aaf7bd', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-04 10:58:43', NULL, '2025-10-04 10:58:47'),
(42, 4, 400.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759663562-59', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 5', NULL, NULL, NULL, '2025-10-05 11:26:02', NULL, '2025-10-05 11:26:02'),
(43, 8, 400.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759663606-59', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 5', NULL, NULL, NULL, '2025-10-05 11:26:46', NULL, '2025-10-05 11:26:46'),
(44, 12, 400.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759663645-59', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 5', NULL, NULL, NULL, '2025-10-05 11:27:25', NULL, '2025-10-05 11:27:25'),
(45, 1, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759841863-68', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-07 12:57:43', NULL, '2025-10-07 12:57:43'),
(46, 4, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759841909-68', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-07 12:58:29', NULL, '2025-10-07 12:58:29'),
(47, 9, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759841953-68', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-07 12:59:13', NULL, '2025-10-07 12:59:13'),
(48, 1, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759845475-69', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-07 13:57:55', NULL, '2025-10-07 13:57:55'),
(49, 9, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759845534-69', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-07 13:58:54', NULL, '2025-10-07 13:58:54'),
(50, 8, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1759845578-69', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-07 13:59:38', NULL, '2025-10-07 13:59:38'),
(51, 8, 3400.00, 'NGN', 'winning', 'completed', '1V1-WIN-1759956278-69', NULL, NULL, '1v1 Tournament winnings: 1v1 Tournament - Oct 7', NULL, NULL, NULL, '2025-10-08 20:44:38', NULL, '2025-10-08 20:44:38'),
(52, 12, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1760000340-f08bd2d4', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-09 08:59:00', NULL, '2025-10-09 08:59:11'),
(53, 8, 1700.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760210510-31', NULL, NULL, 'Match winnings from 1vs1 match #31 (including returned stake)', NULL, NULL, NULL, '2025-10-11 19:21:50', NULL, '2025-10-11 19:21:50'),
(54, 8, 500.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1760214274-70', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 11', NULL, NULL, NULL, '2025-10-11 20:24:34', NULL, '2025-10-11 20:24:34'),
(55, 1, 500.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1760214406-70', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 11', NULL, NULL, NULL, '2025-10-11 20:26:46', NULL, '2025-10-11 20:26:46'),
(56, 9, 3000.00, 'NGN', 'deposit', 'completed', 'XTX-1760214491-6241aa37', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-11 20:28:11', NULL, '2025-10-11 20:28:17'),
(57, 9, 500.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1760214541-70', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 11', NULL, NULL, NULL, '2025-10-11 20:29:01', NULL, '2025-10-11 20:29:01'),
(58, 4, 8500.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760354768-28', NULL, NULL, 'Match winnings from 1vs1 match #28 (including returned stake)', NULL, NULL, NULL, '2025-10-13 11:26:08', NULL, '2025-10-13 11:26:08'),
(59, 4, 7000.00, 'NGN', 'deposit', 'completed', 'XTX-1760354982-7919c2c9', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-13 11:29:42', NULL, '2025-10-13 11:31:06'),
(60, 4, 7000.00, 'NGN', 'deposit', 'completed', 'XTX-1760355119-367c2335', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-13 11:31:59', NULL, '2025-10-13 11:32:04'),
(61, 16, 850.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760356675-29', NULL, NULL, 'Match winnings from 1vs1 match #29 (including returned stake)', NULL, NULL, NULL, '2025-10-13 11:57:55', NULL, '2025-10-13 11:57:55'),
(62, 14, 4250.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760379108-32', NULL, NULL, 'Match winnings from 1vs1 match #32 (including returned stake)', NULL, NULL, NULL, '2025-10-13 18:11:48', NULL, '2025-10-13 18:11:48'),
(63, 16, 6800.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760388094-34', NULL, NULL, 'Match winnings from 1vs1 match #34 (including returned stake)', NULL, NULL, NULL, '2025-10-13 20:41:34', NULL, '2025-10-13 20:41:34'),
(66, 4, 1000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1760442122-35', NULL, NULL, 'Stake deduction for 1vs1 match #35', NULL, NULL, NULL, '2025-10-14 11:42:02', NULL, '2025-10-14 11:42:02'),
(67, 16, 1700.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760442212-35', NULL, NULL, 'Match winnings from 1vs1 match #35 (including returned stake)', NULL, NULL, NULL, '2025-10-14 11:43:32', NULL, '2025-10-14 11:43:32'),
(68, 16, 7000.00, 'NGN', 'deposit', 'completed', 'XTX-1760445544-cec86181', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-14 12:39:04', NULL, '2025-10-14 12:39:07'),
(69, 16, 2000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1760445566-33', NULL, NULL, 'Stake deduction for 1vs1 match #33', NULL, NULL, NULL, '2025-10-14 12:39:26', NULL, '2025-10-14 12:39:26'),
(70, 16, 3400.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760445647-33', NULL, NULL, 'Match winnings from 1vs1 match #33 (including returned stake)', NULL, NULL, NULL, '2025-10-14 12:40:47', NULL, '2025-10-14 12:40:47'),
(71, 14, 3400.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1760446497-37', NULL, NULL, 'Match winnings from 1vs1 match #37 (including returned stake)', NULL, NULL, NULL, '2025-10-14 12:54:57', NULL, '2025-10-14 12:54:57'),
(72, 4, -5000.00, 'NGN', 'withdrawal', 'failed', 'XTX-1760690240-532f8e4e', NULL, NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-17 08:37:20', NULL, '2025-10-17 08:37:20'),
(73, 4, -500.00, 'NGN', 'withdrawal', 'failed', 'XTX-1760691828-0f72da4c', NULL, NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-17 09:03:48', NULL, '2025-10-17 09:03:48'),
(74, 4, 3000.00, 'NGN', 'deposit', 'pending', 'XTX-1760692235-ca19cd95', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-17 09:10:35', NULL, '2025-10-17 09:10:35'),
(75, 4, -2500.00, 'NGN', 'withdrawal', 'completed', 'XTX-1760777714-29fa9108', NULL, NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-18 08:55:14', NULL, '2025-10-18 08:58:42'),
(76, 4, -2500.00, 'NGN', 'withdrawal', 'completed', 'XTX-1760780607-7434aa59', 'SIMULATED_XTX-1760780607-7434aa59', NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-18 09:43:27', NULL, '2025-10-18 09:46:12'),
(77, 4, -2500.00, 'NGN', 'withdrawal', 'pending', 'XTX-1760780808-d52e70b9', 'SIMULATED_XTX-1760780808-d52e70b9', NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-18 09:46:48', NULL, '2025-10-18 09:46:48'),
(78, 4, 3000.00, 'NGN', 'deposit', 'completed', 'XTX-1760780846-d49170cb', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-18 09:47:26', NULL, '2025-10-18 09:47:31'),
(79, 4, -3000.00, 'NGN', 'withdrawal', 'completed', 'XTX-1760780877-d3898718', 'SIMULATED_XTX-1760780877-d3898718', NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-18 09:47:57', NULL, '2025-10-18 09:49:28'),
(80, 4, -5000.00, 'NGN', 'withdrawal', 'completed', 'XTX-1760972803-b37d4cc2', 'SIMULATED_XTX-1760972803-b37d4cc2', NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-20 15:06:43', NULL, '2025-10-20 15:07:15'),
(81, 4, -5000.00, 'NGN', 'withdrawal', 'pending', 'XTX-1760972847-22f50bdc', 'SIMULATED_XTX-1760972847-22f50bdc', NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-20 15:07:27', NULL, '2025-10-20 15:07:27'),
(82, 4, -5000.00, 'NGN', 'withdrawal', 'pending', 'XTX-1760972863-6ea41985', 'SIMULATED_XTX-1760972863-6ea41985', NULL, 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-20 15:07:43', NULL, '2025-10-20 15:07:43'),
(83, 4, -5000.00, 'NGN', 'withdrawal', 'completed', 'XTX-1761062764-8ea6bc72', NULL, '{\"bank_name\":\"opay\",\"bank_code\":\"opay\",\"account_number\":\"8133510904\",\"account_name\":\"Pending Verification\"}', 'Withdrawal request to bank', NULL, NULL, NULL, '2025-10-21 16:06:04', '2025-10-21 16:06:53', '2025-10-21 16:06:53'),
(84, 15, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1761066790-ecb9493c', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-21 17:13:10', NULL, '2025-10-21 17:13:13'),
(85, 14, 7000.00, 'NGN', 'deposit', 'completed', 'XTX-1761066901-ec66defa', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-21 17:15:01', NULL, '2025-10-21 17:15:03'),
(86, 11, 5000.00, 'NGN', 'deposit', 'completed', 'XTX-1761067284-6ce72e21', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-21 17:21:24', NULL, '2025-10-21 17:21:30'),
(87, 14, 17000.00, 'NGN', 'winning', 'completed', 'SQUAD-WIN-1761067533-72', NULL, NULL, 'Squad tournament winnings: Squad Tournament - Oct 21', NULL, NULL, NULL, '2025-10-21 17:25:33', NULL, '2025-10-21 17:25:33'),
(88, 4, -5000.00, 'NGN', '', 'completed', 'XTX-1761239904-7062bb47', '{\"recipient_id\":1,\"recipient_name\":\"danex\",\"recipient_account\":\"XP00000001\"}', NULL, 'Fund transfer to danex', NULL, NULL, NULL, '2025-10-23 17:18:24', NULL, '2025-10-23 17:18:24'),
(89, 1, 5000.00, 'NGN', '', 'completed', 'XTX-1761239904-ddbe4138', '{\"sender_id\":4,\"sender_name\":\"lenovo\",\"sender_account\":\"XP00000004\"}', NULL, 'Fund transfer from lenovo', NULL, NULL, NULL, '2025-10-23 17:18:24', NULL, '2025-10-23 17:18:24'),
(90, 4, -2000.00, 'NGN', '', 'completed', 'XTX-1761341255-870b265b', '{\"recipient_id\":1,\"recipient_name\":\"danex\",\"recipient_account\":\"XP00000001\"}', NULL, 'Fund transfer to danex', NULL, NULL, NULL, '2025-10-24 21:27:35', NULL, '2025-10-24 21:27:35'),
(91, 1, 2000.00, 'NGN', '', 'completed', 'XTX-1761341255-fc387d64', '{\"sender_id\":4,\"sender_name\":\"lenovo\",\"sender_account\":\"XP00000004\"}', NULL, 'Fund transfer from lenovo', NULL, NULL, NULL, '2025-10-24 21:27:35', NULL, '2025-10-24 21:27:35'),
(92, 12, 1700.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-1761382186-38', NULL, NULL, 'Match winnings from 1vs1 match #38 (including returned stake)', NULL, NULL, NULL, '2025-10-25 08:49:47', NULL, '2025-10-25 08:49:47'),
(93, 9, 10000.00, 'NGN', 'deposit', 'completed', 'XTX-1761387171-f349e9c3', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-25 10:12:51', NULL, '2025-10-25 10:12:56'),
(94, 9, 1000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1761387352-39', NULL, NULL, 'Stake deduction for 1vs1 match #39', NULL, NULL, NULL, '2025-10-25 10:15:52', NULL, '2025-10-25 10:15:52'),
(95, 1, 2000.00, 'NGN', 'refund', 'completed', 'MATCH-STAKE-RETURN-1761387471-39', NULL, NULL, 'Stake return from 1vs1 match #39 (custom prize pool)', NULL, NULL, NULL, '2025-10-25 10:17:51', NULL, '2025-10-25 10:17:51'),
(96, 9, 2550.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-CUSTOM-1761387471-39', NULL, NULL, 'Custom prize pool winnings from 1vs1 match #39', NULL, NULL, NULL, '2025-10-25 10:17:51', NULL, '2025-10-25 10:17:51'),
(97, 9, 2000.00, 'NGN', 'refund', 'completed', 'MATCH-STAKE-RETURN-1761390821-40', NULL, NULL, 'Stake return from 1vs1 match #40 (custom prize pool)', NULL, NULL, NULL, '2025-10-25 11:13:41', NULL, '2025-10-25 11:13:41'),
(98, 9, 2125.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-CUSTOM-1761390821-40', NULL, NULL, 'Custom prize pool winnings from 1vs1 match #40', NULL, NULL, NULL, '2025-10-25 11:13:41', NULL, '2025-10-25 11:13:41'),
(99, 16, 1000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1761462489-41', NULL, NULL, 'Stake deduction for 1vs1 match #41', NULL, NULL, NULL, '2025-10-26 07:08:09', NULL, '2025-10-26 07:08:09'),
(100, 15, 1000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1761463499-44', NULL, NULL, 'Stake deduction for 1vs1 match #44', NULL, NULL, NULL, '2025-10-26 07:24:59', NULL, '2025-10-26 07:24:59'),
(101, 6, 2000.00, 'NGN', 'refund', 'completed', 'MATCH-STAKE-RETURN-1761463864-44', NULL, NULL, 'Stake return from 1vs1 match #44 (custom prize pool)', NULL, NULL, NULL, '2025-10-26 07:31:04', NULL, '2025-10-26 07:31:04'),
(102, 15, 2125.00, 'NGN', 'winning', 'completed', 'MATCH-WIN-CUSTOM-1761463865-44', NULL, NULL, 'Custom prize pool winnings from 1vs1 match #44', NULL, NULL, NULL, '2025-10-26 07:31:05', NULL, '2025-10-26 07:31:05'),
(103, 4, 1000.00, 'NGN', 'tournament_entry', 'completed', '1V1-ENTRY-1761923586-74', NULL, NULL, '1v1 Tournament entry fee: 1v1 Tournament - Oct 28', NULL, NULL, NULL, '2025-10-31 15:13:06', NULL, '2025-10-31 15:13:06'),
(104, 4, 10000.00, 'NGN', 'deposit', 'completed', 'XTX-1761923768-ab2d9edd', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-31 15:16:08', NULL, '2025-10-31 15:16:12'),
(105, 4, 50000.00, 'NGN', 'deposit', 'completed', 'XTX-1761924776-b512b359', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-10-31 15:32:56', NULL, '2025-10-31 15:33:50'),
(106, 15, 3000.00, 'NGN', 'deposit', 'completed', 'XTX-1762763520-bd8fbebb', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-11-10 08:32:00', NULL, '2025-11-10 08:32:04'),
(107, 15, 1000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1762763544-48', NULL, NULL, 'Stake deduction for 1vs1 match #48', NULL, NULL, NULL, '2025-11-10 08:32:24', NULL, '2025-11-10 08:32:24'),
(108, 16, 1000.00, 'NGN', '', 'completed', 'MATCH-STAKE-1762763690-49', NULL, NULL, 'Stake deduction for 1vs1 match #49', NULL, NULL, NULL, '2025-11-10 08:34:50', NULL, '2025-11-10 08:34:50'),
(109, 4, 5000.00, 'NGN', 'deposit', 'pending', 'XTX-1762809612-681d245f', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-11-10 21:20:12', NULL, '2025-11-10 21:20:12'),
(110, 4, -5000.00, 'NGN', 'withdrawal', 'completed', 'XTX-1762809871-3e474457', NULL, '{\"bank_name\":\"opay\",\"bank_code\":\"opay\",\"account_number\":\"8078660415\",\"account_name\":\"Pending Verification\",\"user_id\":4,\"username\":\"lenovo\"}', 'Withdrawal request to bank', NULL, NULL, NULL, '2025-11-10 21:24:31', '2025-11-10 21:25:59', '2025-11-10 21:25:59'),
(111, 4, -2000.00, 'NGN', 'withdrawal', 'pending_approval', 'XTX-1762844526-01db2f9d', NULL, '{\"bank_name\":\"opay\",\"bank_code\":\"opay\",\"account_number\":\"8078660415\",\"account_name\":\"Pending Verification\",\"user_id\":4,\"username\":\"lenovo\"}', 'Withdrawal request to bank', NULL, NULL, NULL, '2025-11-11 07:02:06', NULL, '2025-11-11 07:02:06'),
(112, 16, 90000.00, 'NGN', 'deposit', 'pending', 'XTX-1762939606-09a65156', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-11-12 09:26:46', NULL, '2025-11-12 09:26:46'),
(113, 16, 90000.00, 'NGN', 'deposit', 'completed', 'XTX-1762939787-604b1655', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-11-12 09:29:47', NULL, '2025-11-12 09:29:53'),
(114, 12, 6000.00, 'NGN', 'deposit', 'completed', 'XTX-1762940555-fe09f1ba', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-11-12 09:42:35', NULL, '2025-11-12 09:43:21'),
(115, 4, 72250.00, 'NGN', 'winning', 'completed', 'TOURNAMENT-WIN-1762950897-86', NULL, NULL, 'Tournament winnings: survival Tournament - Nov 12', NULL, NULL, NULL, '2025-11-12 12:34:57', NULL, '2025-11-12 12:34:57'),
(116, 3, 500000.00, 'NGN', 'deposit', 'completed', 'XTX-1763019432-619f646b', '1763019555608-FLW-MOCK-REF', NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-11-13 07:37:12', NULL, '2025-11-13 07:38:29'),
(117, 4, 144500.00, 'NGN', 'winning', 'completed', 'TOURNAMENT-WIN-1763057425-87', NULL, NULL, 'Tournament winnings: survival Tournament - Nov 13', NULL, NULL, NULL, '2025-11-13 18:10:25', NULL, '2025-11-13 18:10:25'),
(118, 4, -1100.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764620628916-88', NULL, NULL, 'Tournament entry fee: WAR', NULL, NULL, NULL, '2025-12-01 20:23:49', NULL, '2025-12-01 20:23:49'),
(119, 4, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764620686057-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-01 20:24:46', NULL, '2025-12-01 20:24:46'),
(120, 6, 70000.00, 'NGN', 'deposit', 'completed', 'XTX-1764711153-45c61050', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-02 21:32:33', NULL, '2025-12-02 21:32:38'),
(121, 6, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711189908-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:33:09', NULL, '2025-12-02 21:33:09'),
(122, 16, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711289840-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:34:49', NULL, '2025-12-02 21:34:49'),
(123, 8, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711353054-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:35:53', NULL, '2025-12-02 21:35:53'),
(124, 9, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711435310-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:37:16', NULL, '2025-12-02 21:37:16'),
(125, 15, 70000.00, 'NGN', 'deposit', 'completed', 'XTX-1764711662-28324206', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-02 21:41:02', NULL, '2025-12-02 21:41:04'),
(126, 15, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711687644-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:41:27', NULL, '2025-12-02 21:41:27'),
(127, 10, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711901444-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:45:01', NULL, '2025-12-02 21:45:01'),
(128, 12, -2000.00, 'NGN', 'tournament_entry', 'completed', 'TOURNAMENT-ENTRY-1764711949738-89', NULL, NULL, 'Tournament entry fee: the first', NULL, NULL, NULL, '2025-12-02 21:45:49', NULL, '2025-12-02 21:45:49'),
(129, 14, -5000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1765886475242-j60gbiiux', NULL, NULL, 'Converted to 104166 XP points', NULL, NULL, NULL, '2025-12-16 12:01:15', NULL, '2025-12-16 12:01:15'),
(130, 14, 2000.00, 'USD', 'deposit', 'pending', 'XTX-1765917921823-b8nfx9dc7', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-16 20:45:21', NULL, '2025-12-16 20:45:21'),
(131, 14, 5000.00, 'USD', 'deposit', 'pending', 'XTX-1765918587711-oo3ganmup', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-16 20:56:27', NULL, '2025-12-16 20:56:27'),
(132, 14, 5000.00, 'USD', 'deposit', 'pending', 'XTX-1765919894125-tkx2v103o', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-16 21:18:14', NULL, '2025-12-16 21:18:14'),
(133, 14, -2000.00, 'USD', '', 'completed', 'XTX-1765921447152-7qfj1t3wp', '{\"recipient_id\":4,\"recipient_name\":\"lenovo\",\"recipient_account\":\"XP00000004\"}', NULL, 'Fund transfer to lenovo', NULL, NULL, NULL, '2025-12-16 21:44:07', NULL, '2025-12-16 21:44:07'),
(134, 4, 2000.00, 'USD', 'deposit', 'completed', 'XTX-1765921447160-47f5qbq4t', '{\"sender_id\":14,\"sender_name\":\"pufpuf\"}', NULL, 'Fund transfer from pufpuf', NULL, NULL, NULL, '2025-12-16 21:44:07', NULL, '2025-12-16 21:44:07'),
(135, 4, 0.00, 'XP', '', 'completed', 'MATCH-CREATE-1766524975706-67', NULL, NULL, 'Match entry fee for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-23 21:22:55', NULL, '2025-12-23 21:22:55'),
(136, 4, 0.00, 'XP', '', 'completed', 'MATCH-CREATE-1766525064027-68', NULL, NULL, 'Match entry fee for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-23 21:24:24', NULL, '2025-12-23 21:24:24'),
(137, 14, 0.00, 'XP', '', 'completed', 'MATCH-CREATE-1766525841289-69', NULL, NULL, 'Match entry fee for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-23 21:37:21', NULL, '2025-12-23 21:37:21'),
(138, 4, 0.00, 'XP', '', 'completed', 'MATCH-CREATE-1766663443842-70', NULL, NULL, 'Match entry fee for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-25 11:50:43', NULL, '2025-12-25 11:50:43'),
(139, 14, 0.00, 'XP', '', 'completed', 'MATCH-CREATE-1766664031758-71', NULL, NULL, 'Match entry fee for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-25 12:00:31', NULL, '2025-12-25 12:00:31'),
(140, 4, -238500.00, 'NGN', 'withdrawal', 'completed', 'XP-CONV-1766750845658-gb2a1tqi4', NULL, NULL, 'Converted to 5962 XP points', NULL, NULL, NULL, '2025-12-26 12:07:25', NULL, '2025-12-26 12:07:25'),
(141, 8, 100000000.00, 'NGN', 'deposit', 'completed', 'XTX-1766752067-89702c30', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-26 12:27:47', NULL, '2025-12-26 12:27:53'),
(142, 8, -1000000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1766752248060-r38fqg6cb', NULL, NULL, 'Converted to 20833333 XP points', NULL, NULL, NULL, '2025-12-26 12:30:48', NULL, '2025-12-26 12:30:48'),
(143, 12, 200000000.00, 'NGN', 'deposit', 'completed', 'XTX-1766831488-02ad89f6', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2025-12-27 10:31:28', NULL, '2025-12-27 10:31:32'),
(144, 12, -1000000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1766831556256-b79yl1z3u', NULL, NULL, 'Converted to 20833333 XP points', NULL, NULL, NULL, '2025-12-27 10:32:36', NULL, '2025-12-27 10:32:36'),
(145, 8, -30000.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1766832173530-76', NULL, NULL, 'Match entry for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-27 10:42:53', NULL, '2025-12-27 10:42:53'),
(146, 12, -30000.00, 'NGN', '', 'completed', 'MATCH-CREATE-1766832173587-76', NULL, NULL, 'Match stake for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-27 10:42:53', NULL, '2025-12-27 10:42:53'),
(147, 12, 29750.00, 'NGN', '', 'completed', 'MATCH-WIN-1766832428972-76', NULL, NULL, 'Match winnings from Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-27 10:47:08', NULL, '2025-12-27 10:47:08'),
(148, 12, -20200.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1767002948751-77', NULL, NULL, 'Match entry for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 10:09:08', NULL, '2025-12-29 10:09:08'),
(149, 8, -41997.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-1767002948828-77', NULL, NULL, 'Custom prize pool for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 10:09:08', NULL, '2025-12-29 10:09:08'),
(150, 8, 35697.45, 'NGN', '', 'completed', 'MATCH-CUSTOM-WIN-1767003028348-77', NULL, NULL, 'Custom prize winnings from Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 10:10:28', NULL, '2025-12-29 10:10:28'),
(151, 8, 20200.00, 'NGN', '', 'completed', 'MANUAL-FIX-77-ENTRY-FEE', NULL, NULL, 'Opponent entry fee from custom prize match 77', NULL, NULL, NULL, '2025-12-29 10:34:39', NULL, '2025-12-29 10:34:39'),
(152, 14, -20000.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1767005256280-78', NULL, NULL, 'Match entry for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 10:47:36', NULL, '2025-12-29 10:47:36'),
(153, 8, -41997.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-1767005256288-78', NULL, NULL, 'Custom prize pool for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 10:47:36', NULL, '2025-12-29 10:47:36'),
(154, 8, 35697.45, 'NGN', '', 'completed', 'MATCH-CUSTOM-WIN-1767005299297-78', NULL, NULL, 'Custom prize winnings from Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 10:48:19', NULL, '2025-12-29 10:48:19'),
(155, 12, -20000.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1767028618945-79', NULL, NULL, 'Match entry for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 17:16:58', NULL, '2025-12-29 17:16:58'),
(156, 8, -41998.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-1767028618955-79', NULL, NULL, 'Custom prize pool for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 17:16:58', NULL, '2025-12-29 17:16:58'),
(157, 12, 35698.30, 'NGN', '', 'completed', 'MATCH-CUSTOM-WIN-1767028658552-79', NULL, NULL, 'Custom prize winnings from Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 17:17:38', NULL, '2025-12-29 17:17:38'),
(158, 8, 20000.00, 'NGN', '', 'completed', 'MATCH-ENTRY-RETURN-1767028658555-79', NULL, NULL, 'Entry fee return from Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-29 17:17:38', NULL, '2025-12-29 17:17:38'),
(159, 16, -14800.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1767029360147-81', NULL, NULL, 'Match entry for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 17:29:20', NULL, '2025-12-29 17:29:20'),
(160, 12, -31000.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-1767029360160-81', NULL, NULL, 'Custom prize pool for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 17:29:20', NULL, '2025-12-29 17:29:20'),
(161, 12, 2635014800.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-WIN-1767029399328-81', NULL, NULL, 'Custom prize winnings (31000.00 - 15% fee = 26350) + opponent entry fee (14800.00) = 2635014800.00', NULL, NULL, NULL, '2025-12-29 17:29:59', NULL, '2025-12-29 17:29:59'),
(162, 16, -4800.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1767052143134-83', NULL, NULL, 'Match entry for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 23:49:03', NULL, '2025-12-29 23:49:03'),
(163, 12, -10000.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-1767052143148-83', NULL, NULL, 'Custom prize pool for Call of Duty: Mobile', NULL, NULL, NULL, '2025-12-29 23:49:03', NULL, '2025-12-29 23:49:03'),
(164, 12, 13300.00, 'NGN', '', 'completed', 'MATCH-CUSTOM-WIN-1767052650749-83', NULL, NULL, 'Custom prize winnings (10000.00 - 15% fee = 8500) + opponent entry fee (4800.00) = 13300', NULL, NULL, NULL, '2025-12-29 23:57:30', NULL, '2025-12-29 23:57:30'),
(165, 12, -10000.00, 'NGN', '', 'completed', 'MATCH-JOIN-1767090504223-84', NULL, NULL, 'Match entry for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-30 10:28:24', NULL, '2025-12-30 10:28:24'),
(166, 8, -10000.00, 'NGN', '', 'completed', 'MATCH-CREATE-1767090504226-84', NULL, NULL, 'Match stake for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-30 10:28:24', NULL, '2025-12-30 10:28:24'),
(167, 16, -4800.00, 'NGN', '', 'completed', 'MATCH-ACCEPT-1767129603598-85', NULL, NULL, 'Match entry for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-30 21:20:03', NULL, '2025-12-30 21:20:03'),
(168, 8, -4800.00, 'NGN', '', 'completed', 'MATCH-CREATE-1767129603647-85', NULL, NULL, 'Match stake for Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-30 21:20:03', NULL, '2025-12-30 21:20:03'),
(169, 8, 8160.00, 'NGN', '', 'completed', 'MATCH-WIN-1767129659777-85', NULL, NULL, 'Match winnings from Call of Duty: Warzone', NULL, NULL, NULL, '2025-12-30 21:20:59', NULL, '2025-12-30 21:20:59'),
(170, 11, 2000000000.00, 'NGN', 'deposit', 'completed', 'XTX-1767680078-b843a44d', NULL, NULL, 'Wallet deposit via Flutterwave', NULL, NULL, NULL, '2026-01-06 06:14:38', NULL, '2026-01-06 06:14:40'),
(171, 11, -10000000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1767680188397-betw1jtfv', NULL, NULL, 'Converted to 208333333 XP points', NULL, NULL, NULL, '2026-01-06 06:16:28', NULL, '2026-01-06 06:16:28'),
(172, 16, -40000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1767681649991-izgpqzmi7', NULL, NULL, 'Converted to 833333 XP points', NULL, NULL, NULL, '2026-01-06 06:40:49', NULL, '2026-01-06 06:40:49'),
(173, 15, -40000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1767681979311-3jkgfjqgc', NULL, NULL, 'Converted to 833333 XP points', NULL, NULL, NULL, '2026-01-06 06:46:19', NULL, '2026-01-06 06:46:19'),
(174, 3, -300000.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1767725263786-q4hqzy0nr', NULL, NULL, 'Converted to 6250000 XP points', NULL, NULL, NULL, '2026-01-06 18:47:43', NULL, '2026-01-06 18:47:43'),
(175, 6, -68500.00, 'USD', 'withdrawal', 'completed', 'XP-CONV-1767762329236-elkpyt25y', NULL, NULL, 'Converted to 1427083 XP points', NULL, NULL, NULL, '2026-01-07 05:05:29', NULL, '2026-01-07 05:05:29'),
(176, 8, -2000.00, 'USD', 'withdrawal', 'completed', 'XTX-1768244006729-h2jk263qh', NULL, NULL, 'Withdrawal request to bank', NULL, NULL, '{\"bank_name\":\"opay\",\"bank_code\":\"111\",\"account_number\":\"8078660415\",\"account_name\":\"destroyer@gmail.com\",\"user_id\":8,\"username\":\"destroyer\"}', '2026-01-12 18:53:26', NULL, '2026-01-12 19:43:04'),
(183, 8, 5946.00, 'NGN', '', 'completed', 'MATCH_PRIZE_73_1768253625095', NULL, NULL, 'Prize for winning match #73', NULL, NULL, NULL, '2026-01-12 21:33:45', NULL, '2026-01-12 21:33:45');

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

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `firstname`, `lastname`, `password`, `profile_pic`, `rank`, `matches_played`, `tournaments_played`, `tournaments_won`, `wins`, `losses`, `balance`, `is_admin`, `created_at`, `updated_at`, `admin_approved`, `currency`, `win_rate`, `admin_role`, `last_admin_login`, `is_banned`, `enable_2fa`, `login_alerts`, `session_timeout`, `wallet_account_number`, `transaction_pin`, `pin_set_at`, `reset_token`, `token_expiry`, `favorite_games`, `bio`, `account_status`, `xp_points`, `admin_permissions`, `last_seen`) VALUES
(1, 'danex', 'ogbeifundaniel0@gmail.com', NULL, NULL, '$2y$10$eT048b9A1qGnSDScy6IgHOAgNrFpZ4xI8DL6Lc/JVCZP8mavwKAja', 'profile_687b310582dc28.89271792.jpg', 'D', 4, 0, 0, 0, 4, 428100.00, 0, '2025-07-01 17:16:33', '2026-01-12 18:49:55', 0, 'NGN', 0.00, NULL, '2025-07-21 20:07:43', 0, 0, 1, 60, 'XP00000001', NULL, NULL, '416c2171f2d8d40c9972f35cdf36a0e6327b10cd089709ccf3502a768ced7d57', '2025-11-11 11:16:06', NULL, NULL, 'active', 0, NULL, '2026-01-12 08:02:02'),
(3, 'admin', 'woleadenuga@gmail.com', NULL, NULL, '$2y$10$NxMklClkrhqFjsl.WiXwOeI2gYjuyTn18X7c2DCs7Toon/Wc26SeS', 'default.png', 'E', 0, 0, 0, 0, 0, 96000.00, 1, '2025-07-01 18:40:04', '2026-01-12 07:58:53', 1, 'USD', 0.00, 'super_admin', '2026-01-06 06:38:19', 0, 0, 1, 60, 'XP00000003', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2026-01-06 18:47:16', NULL, NULL, NULL, NULL, 'active', 6247920, '[\"view_dashboard\", \"manage_users\", \"approve_withdrawals\", \"view_transactions\", \"manage_xp_rates\"]', '2026-01-12 07:58:53'),
(4, 'lenovo', 'michaelphid@gmail.com', 'lenovo', 'stale', '$2y$10$i4blxQh7qjKUHvM.YhtfBONebyFw5S/OLxMq5DTdgHFXwpBVbHU7W', 'profile_687e6c5d717a96.14040694.jpg', 'SS', 43, 0, 2, 33, 13, 0.00, 0, '2025-07-01 20:37:23', '2026-01-12 18:52:01', NULL, 'NGN', 76.74, NULL, NULL, 0, 1, 1, 30, 'XP00000004', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2025-12-26 12:07:03', 'f5fc08bb8b1d2a2d6cf10d35b3047dbb41f75bc6434f23882803e1c4fe60f88f', '2025-11-11 11:21:20', NULL, NULL, 'active', 3927, NULL, '2026-01-12 18:52:01'),
(5, 'phid', 'tayodestiny@gmail.com', NULL, NULL, '$2y$10$uKPXJjN/JEQg.2quz5a1jOCtxymoX3oNHWa9lWrnoh/J81VD8whay', 'default.png', 'E', 0, 0, 0, 0, 0, 0.00, 0, '2025-07-06 02:01:06', '2026-01-12 08:04:03', NULL, 'USD', 0.00, NULL, NULL, 0, 0, 1, 60, 'XP00000005', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, '2026-01-12 08:04:03'),
(6, 'tomatoe', 'tomatoe@gmail.com', NULL, NULL, '$2y$10$v/m0EJKt8zknGq9S6BznkeL/z60gbHSkIQegjBgrBg5gbY62lt632', 'default.png', 'E', 7, 0, 0, 1, 6, 0.00, 0, '2025-07-06 02:04:25', '2026-01-12 07:55:31', NULL, 'USD', 14.29, NULL, NULL, 0, 0, 1, 60, 'XP00000006', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2026-01-07 05:05:01', NULL, NULL, NULL, NULL, 'active', 1426023, NULL, '2026-01-12 07:55:31'),
(7, 'philip', 'philip@gmail.com', NULL, NULL, '$2y$10$87GrmnZGidMQHPwRglize.9Z.Wk9OpoTQdVhB3r4hLfW3SvFQhxDC', 'profile_6869dabe5a78f3.36109401.jpg', 'E', 0, 0, 0, 0, 0, 2000.00, 0, '2025-07-06 02:07:11', '2026-01-12 08:05:07', NULL, 'USD', 0.00, NULL, NULL, 0, 0, 1, 60, 'XP00000007', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, '2026-01-12 08:05:07'),
(8, 'destroyer', 'destroyer@gmail.com', NULL, NULL, '$2y$10$7HNWs09/lbZuBQOuKfcFXuSzcJd/I1v7ceGcCm3IzRxA9XGkepT7W', 'default.png', 'E', 37, 0, 3, 15, 24, 98952908.89, 0, '2025-07-29 22:32:46', '2026-01-13 09:30:07', NULL, 'USD', 42.11, NULL, NULL, 0, 0, 1, 60, 'XP00000008', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2025-12-26 12:29:54', NULL, NULL, NULL, NULL, 'active', 20843574, NULL, '2026-01-13 09:30:07'),
(9, 'mystic', 'mystic@gmail.com', NULL, NULL, '$2y$10$4f97QcdFcHaH2TZhIPBY4uiw8uphwagDnaykb/AgrnUlV7ShFXdUG', 'default.png', 'C', 23, 0, 0, 12, 12, 7175.00, 0, '2025-07-29 22:38:16', '2026-01-12 07:56:41', NULL, 'USD', 52.17, NULL, NULL, 0, 0, 1, 60, 'XP00000009', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 181, NULL, '2026-01-12 07:56:41'),
(10, 'flawless', 'flawless@gmail.com', NULL, NULL, '$2y$10$GYQO5yammQ4mNvx.zI92mOTbglY7Br3Z07OWxdQpxXJ9a2XMQsxE2', 'default.png', 'D', 7, 0, 0, 4, 3, 1000.00, 0, '2025-07-31 12:03:15', '2026-01-12 07:58:19', NULL, 'USD', 57.14, NULL, NULL, 0, 0, 1, 60, 'XP00000010', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, '2026-01-12 07:58:19'),
(11, 'leinado', 'leinado@gmail.com', NULL, NULL, '$2y$10$5pZfcyYtVs8.Ny5PSCbpn.ikZkaxqytBanN.W7VUYUqc4yMPN6dcK', 'default.png', 'E', 0, 0, 0, 0, 0, 89999999.99, 0, '2025-07-31 12:08:09', '2026-01-12 08:05:50', NULL, 'USD', 0.00, NULL, NULL, 0, 0, 1, 60, 'XP00000011', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2026-01-06 06:15:57', NULL, NULL, NULL, NULL, 'active', 208332833, NULL, '2026-01-12 08:05:50'),
(12, 'kratos', 'kratos@gmail.com', NULL, NULL, '$2y$10$KjJcg8UKS2DLcUC8Xb1/AukOnKd0Le6isSR7pMYGubxb72q.Hl/7m', 'profile_68c6dd24b74589.75579135.jpg', 'B', 20, 0, 0, 13, 7, 99989999.99, 0, '2025-07-31 12:11:51', '2026-01-12 07:57:52', NULL, 'USD', 65.00, NULL, NULL, 0, 0, 1, 60, 'XP00000012', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2025-12-27 10:32:14', NULL, NULL, NULL, NULL, 'active', 20831863, NULL, '2026-01-12 07:57:52'),
(13, 'tsunami', 'tsunami@gmail.com', NULL, NULL, '$2y$10$zSCFPQg9Wq4mn6y08cofvOv1YjSirtCRM1TDAfLyUwQYNkHBdvCpm', 'default.png', 'E', 0, 0, 0, 0, 0, 3000.00, 0, '2025-07-31 12:13:54', '2025-10-23 17:15:27', NULL, 'USD', 0.00, NULL, NULL, 0, 0, 1, 60, 'XP00000013', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, NULL),
(14, 'pufpuf', 'pufpuf@gmail.com', NULL, NULL, '$2y$10$SlfwPHJJ/5v.i2uufPp53eOaFvCIYl6dG771k.UdYESXSu2TfXPDm', 'default.png', 'E', 11, 0, 0, 4, 7, -14350.00, 0, '2025-09-14 15:26:39', '2026-01-12 21:33:45', NULL, 'USD', 33.33, NULL, NULL, 0, 0, 1, 60, 'XP00000014', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2025-12-16 10:21:38', NULL, NULL, NULL, NULL, 'active', 81608, NULL, '2026-01-12 20:06:22'),
(15, 'gradust', 'gradust@gmail.com', NULL, NULL, '$2y$10$Fa6n99URcq91LWw4tWbvGOErQh6QDoqBUGdp2YqXK1mYZqEXfgaxG', 'default.png', 'E', 8, 0, 0, 2, 6, 28625.00, 0, '2025-10-02 10:19:43', '2026-01-12 07:58:07', NULL, 'USD', 25.00, NULL, NULL, 0, 0, 1, 60, 'XP00000015', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2026-01-06 06:45:57', NULL, NULL, NULL, NULL, 'active', 831703, NULL, '2026-01-12 07:58:07'),
(16, 'plaything', 'plaything@gmail.com', NULL, NULL, '$2y$10$a3it.V2VsbVJ/cQljJeYSuLvv03P//hwrs5ncm.FtxnNux2iPQrdG', 'default.png', 'C', 24, 0, 0, 13, 11, 21850.00, 0, '2025-10-02 10:21:40', '2026-01-12 07:56:26', NULL, 'USD', 54.17, NULL, NULL, 0, 0, 1, 60, 'XP00000016', 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481', '2026-01-06 06:40:27', NULL, NULL, NULL, NULL, 'active', 831953, NULL, '2026-01-12 07:56:26'),
(17, 'natest be disoo', 'test@example.com', NULL, NULL, '$2b$12$HdYVxXEr8B.7y41/etZrFeYbY2pe/nvk.wlKjOKLaUPgLkgnxKdbS', 'default.png', 'E', 4, 0, 0, 1, 3, 0.00, 0, '2025-11-18 08:54:24', '2026-01-12 07:56:13', NULL, 'USD', 25.00, NULL, NULL, 0, 0, 1, 60, 'WALLET-000017', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, '2026-01-12 07:56:13'),
(18, 'potex', 'potex22@gmail.com', NULL, NULL, '$2y$10$eT/1h1TSBEoXDUDbQJCY6eiQGuap2UqndFmLyGDMegB1Yo1zfcPUm', 'default.png', 'E', 0, 0, 0, 0, 0, 0.00, 0, '2025-12-01 10:38:15', '2026-01-12 08:06:42', NULL, 'USD', 0.00, NULL, NULL, 0, 0, 1, 60, 'XP85495224', NULL, NULL, NULL, NULL, NULL, NULL, 'active', 0, NULL, '2026-01-12 08:06:42');

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

--
-- Dumping data for table `user_bank_details`
--

INSERT INTO `user_bank_details` (`id`, `user_id`, `bank_details`, `created_at`, `updated_at`) VALUES
(1, 4, '{\"bank_name\":\"opay\",\"bank_code\":\"opay\",\"account_number\":\"8078660415\",\"saved_at\":\"2025-11-11 08:02:06\"}', '2025-11-10 21:24:31', '2025-11-11 07:02:06');

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

--
-- Dumping data for table `user_status`
--

INSERT INTO `user_status` (`user_id`, `is_online`, `last_seen`, `status_message`, `current_game`) VALUES
(1, 0, '2025-12-05 12:50:45', NULL, NULL),
(3, 0, '2025-12-05 12:50:45', NULL, NULL),
(4, 0, '2025-12-05 12:50:45', NULL, NULL),
(5, 0, '2025-12-05 12:50:45', NULL, NULL),
(6, 0, '2025-12-05 12:50:45', NULL, NULL),
(7, 0, '2025-12-05 12:50:45', NULL, NULL),
(8, 0, '2025-12-05 12:50:45', NULL, NULL),
(9, 0, '2025-12-05 12:50:45', NULL, NULL),
(10, 0, '2025-12-05 12:50:45', NULL, NULL),
(11, 0, '2025-12-05 12:50:45', NULL, NULL),
(12, 0, '2025-12-05 12:50:45', NULL, NULL),
(13, 0, '2025-12-05 12:50:45', NULL, NULL),
(14, 0, '2025-12-05 12:50:45', NULL, NULL),
(15, 0, '2025-12-05 12:50:45', NULL, NULL),
(16, 0, '2025-12-05 12:50:45', NULL, NULL),
(17, 0, '2025-12-05 12:50:45', NULL, NULL),
(18, 0, '2025-12-05 12:50:45', NULL, NULL);

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

--
-- Dumping data for table `user_titles`
--

INSERT INTO `user_titles` (`id`, `user_id`, `title_id`, `earned_at`, `is_equipped`, `tournament_id`, `achievement_data`) VALUES
(1, 4, 21, '2025-11-14 06:53:11', 0, NULL, NULL),
(2, 4, 22, '2025-11-14 06:53:11', 0, NULL, NULL),
(3, 4, 23, '2025-11-14 06:53:11', 1, NULL, NULL),
(4, 4, 25, '2025-11-14 06:53:11', 0, NULL, NULL),
(5, 4, 26, '2025-11-14 06:53:12', 0, NULL, NULL),
(6, 4, 27, '2025-11-14 06:53:12', 0, NULL, NULL),
(7, 4, 29, '2025-11-14 06:53:12', 0, NULL, NULL),
(8, 16, 21, '2025-11-14 09:55:33', 1, NULL, NULL),
(9, 8, 21, '2025-11-14 09:58:30', 0, NULL, NULL);

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

--
-- Dumping data for table `user_wallets`
--

INSERT INTO `user_wallets` (`id`, `user_id`, `balance`, `currency`, `updated_at`) VALUES
(1, 1, 0.00, 'NGN', '2025-07-03 10:59:06');

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

--
-- Dumping data for table `withdrawal_requests`
--

INSERT INTO `withdrawal_requests` (`id`, `user_id`, `transaction_id`, `amount`, `currency`, `bank_name`, `bank_code`, `account_number`, `account_name`, `status`, `receipt_number`, `admin_notes`, `processed_by`, `processed_at`, `created_at`, `updated_at`) VALUES
(1, 8, 176, 2000.00, 'USD', 'opay', '111', '8078660415', 'destroyer@gmail.com', 'processing', 'XPR-1768244006745-000008', NULL, 1, '2026-01-12 19:43:04', '2026-01-12 18:53:26', '2026-01-12 19:43:04');

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

--
-- Dumping data for table `xp_rates`
--

INSERT INTO `xp_rates` (`id`, `currency`, `xp_per_unit`, `unit_amount`, `is_active`, `created_at`, `updated_at`, `description`) VALUES
(3, 'USD', 25.00, 1.20, 1, '2025-12-16 11:34:08', '2025-12-16 11:34:08', '25 XP per 1.2 USD'),
(4, 'EUR', 25.00, 1.10, 1, '2025-12-16 11:34:08', '2025-12-16 11:34:08', '25 XP per 1.1 EUR'),
(5, 'GBP', 25.00, 0.90, 1, '2025-12-16 11:34:08', '2025-12-16 11:34:08', '25 XP per 0.9 GBP'),
(6, 'NGN', 25.00, 1000.00, 1, '2025-12-16 11:37:41', '2025-12-16 11:37:41', '25 XP per 1000 NGN'),
(7, 'USD', 25.00, 1.20, 1, '2025-12-16 11:37:41', '2025-12-16 11:37:41', '25 XP per 1.2 USD'),
(8, 'EUR', 25.00, 1.10, 1, '2025-12-16 11:37:41', '2025-12-16 11:37:41', '25 XP per 1.1 EUR'),
(9, 'GBP', 25.00, 0.90, 1, '2025-12-16 11:37:41', '2025-12-16 11:37:41', '25 XP per 0.9 GBP');

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

--
-- Dumping data for table `xp_transactions`
--

INSERT INTO `xp_transactions` (`id`, `user_id`, `tournament_id`, `type`, `amount`, `related_transaction_id`, `sender_id`, `receiver_id`, `description`, `metadata`, `created_at`, `match_id`) VALUES
(1, 14, NULL, 'converted_from_money', 104166, 129, NULL, NULL, 'Converted from 5000 USD', NULL, '2025-12-16 12:01:15', NULL),
(2, 14, NULL, 'transferred_out', 200, NULL, 14, 4, '5000', NULL, '2025-12-16 21:31:01', NULL),
(3, 4, NULL, 'transferred_in', 200, NULL, 14, 4, '5000', NULL, '2025-12-16 21:31:01', NULL),
(4, 14, NULL, 'transferred_out', 300, NULL, 14, 4, '5000', NULL, '2025-12-16 21:33:55', NULL),
(5, 4, NULL, 'transferred_in', 300, NULL, 14, 4, '5000', NULL, '2025-12-16 21:33:55', NULL),
(6, 14, NULL, '', -2083, NULL, NULL, NULL, 'XP stake for Call of Duty: Warzone match', NULL, '2025-12-23 21:37:21', 69),
(7, 4, NULL, '', -32, NULL, NULL, NULL, 'XP stake for Call of Duty: Warzone match', NULL, '2025-12-25 11:50:44', 70),
(8, 14, NULL, '', -4973, NULL, NULL, NULL, 'XP stake for Call of Duty: Warzone match', NULL, '2025-12-25 12:00:31', 71),
(9, 4, NULL, 'converted_from_money', 5962, 140, NULL, NULL, 'Converted from 238500 NGN', NULL, '2025-12-26 12:07:25', NULL),
(10, 4, NULL, '', -4973, NULL, NULL, NULL, 'Match stake for Call of Duty: Mobile', NULL, '2025-12-26 12:07:49', 72),
(11, 14, NULL, '', -4973, NULL, NULL, NULL, 'Match stake for Call of Duty: Mobile', NULL, '2025-12-26 12:07:49', 72),
(12, 8, NULL, 'converted_from_money', 20833333, 142, NULL, NULL, 'Converted from 1000000 USD', NULL, '2025-12-26 12:30:48', NULL),
(13, 8, NULL, '', -2973, NULL, NULL, NULL, 'Match stake for Free Fire', NULL, '2025-12-26 12:31:31', 73),
(14, 14, NULL, '', -2973, NULL, NULL, NULL, 'Match stake for Free Fire', NULL, '2025-12-26 12:31:31', 73),
(17, 8, NULL, '', -2083, NULL, NULL, NULL, 'XP stake for Call of Duty: Mobile match', NULL, '2025-12-27 09:36:44', 74),
(18, 14, NULL, '', -2083, NULL, NULL, NULL, 'XP stake for Call of Duty: Mobile match', NULL, '2025-12-27 09:36:44', 74),
(19, 8, NULL, '', 4166, NULL, NULL, NULL, 'XP winnings from match 74 (manual fix)', NULL, '2025-12-27 10:22:34', 74),
(20, 12, NULL, 'converted_from_money', 20833333, 144, NULL, NULL, 'Converted from 1000000 USD', NULL, '2025-12-27 10:32:36', NULL),
(21, 8, NULL, '', -4973, NULL, NULL, NULL, 'XP stake for Call of Duty: Warzone match', NULL, '2025-12-30 10:22:28', 71),
(22, 14, NULL, '', -4973, NULL, NULL, NULL, 'XP stake for Call of Duty: Warzone match', NULL, '2025-12-30 10:22:28', 71),
(25, 8, 98, 'spent', 500, NULL, NULL, NULL, 'Tournament entry fee: conquer', NULL, '2026-01-06 05:52:47', NULL),
(26, 11, NULL, 'converted_from_money', 208333333, 171, NULL, NULL, 'Converted from 10000000 USD', NULL, '2026-01-06 06:16:28', NULL),
(27, 11, 98, 'spent', 500, NULL, NULL, NULL, 'Tournament entry fee: conquer', NULL, '2026-01-06 06:17:04', NULL),
(28, 16, NULL, 'converted_from_money', 833333, 172, NULL, NULL, 'Converted from 40000 USD', NULL, '2026-01-06 06:40:50', NULL),
(29, 15, NULL, 'converted_from_money', 833333, 173, NULL, NULL, 'Converted from 40000 USD', NULL, '2026-01-06 06:46:19', NULL),
(30, 4, 98, 'spent', 500, NULL, NULL, NULL, 'Tournament entry fee: conquer', NULL, '2026-01-06 15:26:12', NULL),
(31, 15, 98, 'spent', 500, NULL, NULL, NULL, 'Tournament entry fee: conquer', NULL, '2026-01-06 15:38:36', NULL),
(35, 4, 98, 'earned', 1190, NULL, NULL, NULL, '🏆 Tournament prize (1st place): conquer', NULL, '2026-01-06 18:41:01', NULL),
(36, 15, 98, 'earned', 340, NULL, NULL, NULL, 'Tournament prize (2nd place): conquer', NULL, '2026-01-06 18:41:01', NULL),
(37, 8, 98, 'earned', 170, NULL, NULL, NULL, 'Tournament prize (3rd place): conquer', NULL, '2026-01-06 18:41:01', NULL),
(38, 4, 98, 'earned', 1700, NULL, NULL, NULL, 'Tournament victory: conquer', NULL, '2026-01-06 18:41:01', NULL),
(39, 3, NULL, 'converted_from_money', 6250000, 174, NULL, NULL, 'Converted from 300000 USD', NULL, '2026-01-06 18:47:43', NULL),
(40, 3, 99, 'spent', 1020, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 04:44:15', NULL),
(41, 3, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:01:59', NULL),
(42, 15, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:02:28', NULL),
(43, 12, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:02:57', NULL),
(44, 8, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:03:10', NULL),
(45, 16, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:03:46', NULL),
(46, 4, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:04:06', NULL),
(47, 6, NULL, 'converted_from_money', 1427083, 175, NULL, NULL, 'Converted from 68500 USD', NULL, '2026-01-07 05:05:29', NULL),
(48, 6, 100, 'spent', 1060, NULL, NULL, NULL, 'Tournament entry fee: survive', NULL, '2026-01-07 05:05:42', NULL),
(49, 8, 100, 'earned', 5045, NULL, NULL, NULL, '🏆 Tournament prize (1st place): survive', NULL, '2026-01-07 05:18:35', NULL),
(50, 8, 100, 'earned', 7208, NULL, NULL, NULL, 'Tournament victory: survive', NULL, '2026-01-07 05:18:35', NULL),
(51, 8, 101, 'spent', 740, NULL, NULL, NULL, 'Tournament entry fee: winners', NULL, '2026-01-07 05:21:07', NULL),
(52, 8, 103, 'earned', 636, NULL, NULL, NULL, '🏆 Tournament prize (1st place): survivor', NULL, '2026-01-08 17:54:38', NULL),
(53, 9, 103, 'earned', 181, NULL, NULL, NULL, 'Tournament prize (2nd place): survivor', NULL, '2026-01-08 17:54:48', NULL),
(54, 16, 103, 'earned', 90, NULL, NULL, NULL, 'Tournament prize (3rd place): survivor', NULL, '2026-01-08 17:54:48', NULL),
(55, 8, 103, 'earned', 910, NULL, NULL, NULL, 'Tournament victory: survivor', NULL, '2026-01-08 17:54:48', NULL),
(56, 8, 104, 'spent', 410, NULL, NULL, NULL, 'Tournament entry fee: last man standing', NULL, '2026-01-10 01:19:06', NULL),
(57, 12, 104, 'spent', 410, NULL, NULL, NULL, 'Tournament entry fee: last man standing', NULL, '2026-01-10 03:52:57', NULL),
(58, 16, 104, 'spent', 410, NULL, NULL, NULL, 'Tournament entry fee: last man standing', NULL, '2026-01-10 03:54:56', NULL),
(59, 15, 104, 'spent', 410, NULL, NULL, NULL, 'Tournament entry fee: last man standing', NULL, '2026-01-10 03:55:25', NULL),
(60, 8, 105, 'spent', 490, NULL, NULL, NULL, 'Tournament entry fee: conquer 2', NULL, '2026-01-10 09:43:56', NULL),
(61, 8, 109, 'earned', 481, NULL, NULL, NULL, '🏆 Tournament prize (1st place): conquer 6', NULL, '2026-01-12 07:43:52', NULL),
(62, 8, 109, 'earned', 689, NULL, NULL, NULL, 'Tournament victory: conquer 6', NULL, '2026-01-12 07:43:52', NULL),
(63, 4, 110, 'earned', 487, NULL, NULL, NULL, '🏆 Tournament prize (1st place): conquer 7', NULL, '2026-01-12 07:53:36', NULL),
(64, 4, 110, 'earned', 697, NULL, NULL, NULL, 'Tournament victory: conquer 7', NULL, '2026-01-12 07:53:36', NULL);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `admin_messages`
--
ALTER TABLE `admin_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admin_monitoring_logs`
--
ALTER TABLE `admin_monitoring_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `fraud_flags`
--
ALTER TABLE `fraud_flags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friends`
--
ALTER TABLE `friends`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `friend_activities`
--
ALTER TABLE `friend_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friend_chat`
--
ALTER TABLE `friend_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `group_chat`
--
ALTER TABLE `group_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `group_chat_visits`
--
ALTER TABLE `group_chat_visits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `group_tournaments`
--
ALTER TABLE `group_tournaments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `match_attempts`
--
ALTER TABLE `match_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT for table `match_chat`
--
ALTER TABLE `match_chat`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_chat_messages`
--
ALTER TABLE `match_chat_messages`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `match_confirmations`
--
ALTER TABLE `match_confirmations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_disputes`
--
ALTER TABLE `match_disputes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `match_history`
--
ALTER TABLE `match_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `match_proofs`
--
ALTER TABLE `match_proofs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `match_results`
--
ALTER TABLE `match_results`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `match_votes`
--
ALTER TABLE `match_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=774;

--
-- AUTO_INCREMENT for table `one_vs_one_match`
--
ALTER TABLE `one_vs_one_match`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `one_vs_one_matches`
--
ALTER TABLE `one_vs_one_matches`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- AUTO_INCREMENT for table `one_vs_one_tournament`
--
ALTER TABLE `one_vs_one_tournament`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=191;

--
-- AUTO_INCREMENT for table `one_vs_one_tournaments`
--
ALTER TABLE `one_vs_one_tournaments`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- AUTO_INCREMENT for table `rank_history`
--
ALTER TABLE `rank_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rank_requirements`
--
ALTER TABLE `rank_requirements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `receipt_templates`
--
ALTER TABLE `receipt_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `revenue`
--
ALTER TABLE `revenue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `titles`
--
ALTER TABLE `titles`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `title_awards`
--
ALTER TABLE `title_awards`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournaments`
--
ALTER TABLE `tournaments`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- AUTO_INCREMENT for table `tournament_admins`
--
ALTER TABLE `tournament_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tournament_bets`
--
ALTER TABLE `tournament_bets`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tournament_chat`
--
ALTER TABLE `tournament_chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `tournament_invites`
--
ALTER TABLE `tournament_invites`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tournament_matches`
--
ALTER TABLE `tournament_matches`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `tournament_match_claims`
--
ALTER TABLE `tournament_match_claims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tournament_participants`
--
ALTER TABLE `tournament_participants`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=331;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=184;

--
-- AUTO_INCREMENT for table `trust_score_history`
--
ALTER TABLE `trust_score_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `user_bank_accounts`
--
ALTER TABLE `user_bank_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_bank_details`
--
ALTER TABLE `user_bank_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_titles`
--
ALTER TABLE `user_titles`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_wallets`
--
ALTER TABLE `user_wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `xp_rates`
--
ALTER TABLE `xp_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `xp_transactions`
--
ALTER TABLE `xp_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

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
