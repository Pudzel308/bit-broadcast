import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('socialApp.db');
        console.log('Database opened:', db.name);
        await db.execAsync('PRAGMA foreign_keys = ON;');
    }

    await executeSql(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        );`
    );

    await executeSql(`
        INSERT OR IGNORE INTO users (id, name, email)
        VALUES (1, 'DefaultUser', 'default@example.com');
    `);

    await executeSql(
        `CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tag TEXT NOT NULL DEFAULT 'General',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );`
    );

    await executeSql(
        `CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            user_id INTEGER,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );`
    );

    await executeSql(
        `CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER,
            user_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );`
    );

    await executeSql(`
        CREATE TABLE IF NOT EXISTS comment_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comment_id INTEGER,
            user_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
};

const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('socialApp.db');
        await db.execAsync('PRAGMA foreign_keys = ON;');
    }
    return db;
};

export const executeSql = async (sql: string, params: any[] = []) => {
    if (!db) throw new Error('Database not initialized');
    return db.runAsync(sql, params);
};

export const getPosts = async () => {
    const result = await db!.getAllAsync(
        `SELECT id, user_id, title, content, tag, created_at
        FROM posts
        ORDER BY created_at DESC`
    );
    return result;
};

export const getPostStats = async () => {
    try {
        const db = await getDb();
        const result = await db.getAllAsync(
            `SELECT
                posts.id,
                posts.user_id,
                posts.title,
                posts.content,
                posts.tag,
                posts.created_at,
                (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS like_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count,
                EXISTS (
                    SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?
                ) AS liked_by_user
            FROM posts
            ORDER BY posts.created_at DESC;`,
            [1]
        );
        return result;
    } catch (err) {
        console.error('getPostStats failed:', err);
        throw err;
    }
};

export const createPost = async (
    userId: number,
    title: string,
    content: string,
    tag: string
) => {
    try {
        const db = await getDb();
        await db.runAsync(
            'INSERT INTO posts (user_id, title, content, tag) VALUES (?, ?, ?, ?)',
            [userId, title, content, tag]
        );
    } catch (error) {
        console.error('createPost failed:', error);
        throw error;
    }
};

export const updatePost = async (postId: number, title: string, content: string, tag: string) => {
    await executeSql(
        'UPDATE posts SET title = ?, content = ?, tag = ? WHERE id = ?',
        [title, content, tag, postId]
    );
};


export const likePost = async (postId: number, userId: number) => {
    await executeSql(
        'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
        [postId, userId]
    );
};

export const unlikePost = async (postId: number, userId: number) => {
    await executeSql(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
    );
};

export const deletePost = async (postId: number) => {
    if (!db) throw new Error('Database not initialized');
    await db.runAsync('DELETE FROM posts WHERE id = ?', [postId]);
};

export const isPostLikedByUser = async (postId: number, userId: number) => {
    const result = await db!.getFirstAsync(
        'SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
    );
    return !!result;
};

export const getLikeCount = async (postId: number) => {
    const result = await db!.getFirstAsync(
        'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
        [postId]
    );
    return result?.count || 0;
};

export const createComment = async (postId: number, content: string, userId: number) => {
    await executeSql(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, userId, content]
    );
};

export const getCommentsByPost = async (postId: number, userId: number) => {
    try {
        const result = await db!.getAllAsync(
            `
            SELECT
                comments.id,
                comments.user_id,
                comments.post_id,
                comments.content,
                comments.created_at,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = comments.id) AS like_count,
                EXISTS (
                    SELECT 1 FROM comment_likes
                    WHERE comment_likes.comment_id = comments.id
                    AND comment_likes.user_id = ?
                ) AS liked_by_user
            FROM comments
            WHERE post_id = ?
            ORDER BY created_at ASC
            `,
            [userId, postId]
        );
        return result;
    } catch (err) {
        console.error('getting comments by post: Failed:', err);
        throw err;
    }
};

export const likeComment = async (commentId: number, userId: number) => {
    await executeSql(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
        [commentId, userId]
    );
};

export const unlikeComment = async (commentId: number, userId: number) => {
    await executeSql(
        'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
    );
};

export const updateComment = async (commentId: number, newContent: string) => {
    if (!db) throw new Error('Database not initialized');
    await db.runAsync(
        'UPDATE comments SET content = ? WHERE id = ?',
        [newContent, commentId]
    );
};

export const deleteComment = async (commentId: number) => {
    if (!db) throw new Error('Database not initialized');
    await db.runAsync('DELETE FROM comments WHERE id = ?', [commentId]);
};

export const isCommentLikedByUser = async (commentId: number, userId: number) => {
    const result = await db!.getFirstAsync(
        'SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
    );
    return !!result;
};
