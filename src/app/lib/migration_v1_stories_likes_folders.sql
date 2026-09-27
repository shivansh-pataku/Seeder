-- ==============================================================================
-- Migration: Rename TASKS to stories, Add Story Metadata, Create Likes & Folders
-- Compatible with MySQL 8.0+
-- Database: MAJOR
-- ==============================================================================

-- 1. Safely rename TASKS to stories if TASKS exists and stories does not
SET @table_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'TASKS'
);
SET @stories_exists = (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'stories'
);

SET @rename_sql = IF(@table_exists > 0 AND @stories_exists = 0, 'RENAME TABLE TASKS TO stories;', 'SELECT "Table already renamed or TASKS does not exist" AS info;');
PREPARE stmt FROM @rename_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Add missing columns to stories table if they don't already exist
-- story_type
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'stories' AND column_name = 'story_type');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE stories ADD COLUMN story_type VARCHAR(50) DEFAULT "article";', 'SELECT 1;');
PREPARE stmt FROM @alter_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- snippet
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'stories' AND column_name = 'snippet');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE stories ADD COLUMN snippet VARCHAR(500);', 'SELECT 1;');
PREPARE stmt FROM @alter_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- word_count
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'stories' AND column_name = 'word_count');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE stories ADD COLUMN word_count INT DEFAULT 0;', 'SELECT 1;');
PREPARE stmt FROM @alter_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- reading_time_minutes
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'stories' AND column_name = 'reading_time_minutes');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE stories ADD COLUMN reading_time_minutes INT DEFAULT 1;', 'SELECT 1;');
PREPARE stmt FROM @alter_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- likes_count
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'stories' AND column_name = 'likes_count');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE stories ADD COLUMN likes_count INT UNSIGNED DEFAULT 0 NOT NULL;', 'SELECT 1;');
PREPARE stmt FROM @alter_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- updated_at
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'stories' AND column_name = 'updated_at');
SET @alter_sql = IF(@col_exists = 0, 'ALTER TABLE stories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;', 'SELECT 1;');
PREPARE stmt FROM @alter_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Create Likes Table (Composite PK prevents duplicate likes, foreign key cascades on user delete)
CREATE TABLE IF NOT EXISTS likes (
    user_id INT NOT NULL,
    entity_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- e.g. 'story'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, entity_id, entity_type),
    KEY idx_likes_user (user_id),
    KEY idx_likes_entity (entity_id, entity_type),
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE
);

-- 4. Create Folders Table (Adjacency List tree for nested folders)
CREATE TABLE IF NOT EXISTS folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_folders_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- 5. Create Saved Items Table (Bookmarks into folders or root)
CREATE TABLE IF NOT EXISTS saved_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    folder_id INT DEFAULT NULL, -- NULL means root / unsorted
    entity_id INT NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- e.g. 'story'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_saved_user (user_id),
    UNIQUE KEY uk_user_folder_entity (user_id, folder_id, entity_id, entity_type),
    FOREIGN KEY (user_id) REFERENCES users(userid) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- 6. Backfill existing snippets if currently NULL
UPDATE stories 
SET snippet = SUBSTRING(REGEXP_REPLACE(description, '<[^>]+>', ' '), 1, 240)
WHERE snippet IS NULL AND description IS NOT NULL;
