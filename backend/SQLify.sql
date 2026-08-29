CREATE DATABASE IF NOT EXISTS SQLify;
USE SQLify;

-- ==========================
-- Tabla Usuario - consultar opciones del ENUM
-- ==========================
CREATE TABLE Usuario (
  ID_Usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  plan ENUM('free','premium') NOT NULL,
  fecha_alta DATE NOT NULL
);

-- ==========================
-- Tabla Artista
-- ==========================
CREATE TABLE Artista (
  ID_Artista VARCHAR(50) PRIMARY KEY,             -- ID Spotify
  nombre VARCHAR(150) NOT NULL,
  genero VARCHAR(50),
  seguidores INT DEFAULT 0,                       -- followers.total
  popularidad INT DEFAULT 0,                      -- 0–100
  url VARCHAR(255)                                -- external_urls.spotify
);

-- ==========================
-- Tabla Album - consultar ENUM en tipo
-- ==========================
CREATE TABLE Album (
  ID_Album VARCHAR(50) PRIMARY KEY,               -- ID Spotify
  titulo VARCHAR(200) NOT NULL,
  ano YEAR,
  tipo VARCHAR(50),
  total_canciones INT DEFAULT 0,                  -- total_tracks
  url VARCHAR(255)                                -- external_urls.spotify
);

-- ==========================
-- Tabla Cancion 
-- ==========================
CREATE TABLE Cancion (
  ID_Cancion VARCHAR(50) PRIMARY KEY,             -- ID Spotify
  ID_Album VARCHAR(50),
  titulo VARCHAR(200) NOT NULL,
  duracion INT NOT NULL,                          -- segundos
  url VARCHAR(255),                               -- external_urls.spotify
  popularidad INT DEFAULT 0,                      -- 0–100
  FOREIGN KEY (ID_Album) REFERENCES Album(ID_Album)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- ==========================
-- Tabla intermedia - Cancion_artista
-- (para colaboraciones)
-- ==========================
CREATE TABLE Cancion_artista (
  ID_Cancion VARCHAR(50),
  ID_Artista VARCHAR(50),
  PRIMARY KEY (ID_Cancion, ID_Artista),
  FOREIGN KEY (ID_Cancion) REFERENCES Cancion(ID_Cancion)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (ID_Artista) REFERENCES Artista(ID_Artista)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ==========================
-- Tabla intermedia - Album_artista
-- (para álbumes colaborativos)
-- ==========================
CREATE TABLE Album_artista (
  ID_Album VARCHAR(50),
  ID_Artista VARCHAR(50),
  PRIMARY KEY (ID_Album, ID_Artista),
  FOREIGN KEY (ID_Album) REFERENCES Album(ID_Album)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (ID_Artista) REFERENCES Artista(ID_Artista)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ==========================
-- Tabla - Playlist
-- ==========================
CREATE TABLE Playlist (
  ID_Playlist INT AUTO_INCREMENT PRIMARY KEY,
  ID_Usuario INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  fecha_creacion DATE NOT NULL,
  FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ==========================
-- Tabla intermedia - Playlist_cancion
-- ==========================
CREATE TABLE Playlist_cancion (
  ID_Playlist INT,
  ID_Cancion VARCHAR(50),
  fecha_agregada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  orden INT NOT NULL,
  PRIMARY KEY (ID_Playlist, ID_Cancion),
  FOREIGN KEY (ID_Playlist) REFERENCES Playlist(ID_Playlist)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (ID_Cancion) REFERENCES Cancion(ID_Cancion)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ==========================
-- Tabla - Reproduccion
-- ==========================
CREATE TABLE Reproduccion (
  ID_Repro INT AUTO_INCREMENT PRIMARY KEY,
  ID_Usuario INT NOT NULL,
  ID_Cancion VARCHAR(50) NOT NULL,
  dispositivo ENUM('mobile','desktop','speaker') NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duracion INT NOT NULL DEFAULT 1, -- cuánto tiempo se escuchó
  FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (ID_Cancion) REFERENCES Cancion(ID_Cancion)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);


/*

MAS ARTISTAS:

Taylor Swift, Playboi Carti, Bruno Mars, Justin Bieber, Katy Perry, Lady Gaga, Guns N Roses, Soda Stereo,
Arctic Monkeys, Nirvana, My Chemical Romance, Skrillex, Dua Lipa, Linkin Park, Red Hot Chilli Peppers, 
Michael Jackson, Rihanna, Green Day, Three Days Grace, Foo Fighters, Babasonicos, Charly Garcia,
Luis Alberto Spinetta, Daft Punk, 50 cent, Snoop Dogg, Migos, Calvin Harris, Avicii, Future.

*/