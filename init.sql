CREATE TYPE key_status AS ENUM ('available', 'allocated');

CREATE TABLE preallocated_keys (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(7) NOT NULL UNIQUE,
    status key_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_preallocated_keys_available
    ON preallocated_keys (id)
    WHERE status = 'available';

CREATE TABLE short_urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(16) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    user_id UUID NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_short_urls_expires
    ON short_urls (expires_at)
    WHERE expires_at IS NOT NULL;