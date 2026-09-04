const demoDDL = `
  TABLE artista (
    ID_Artista varchar(50) NOT NULL,
    nombre varchar(150),
    genero varchar(50),
    seguidores int,
    popularidad int,
    url varchar(255)
  )

  TABLE album (
    ID_Album varchar(50) NOT NULL,
    titulo varchar(200),
    ano year,
    tipo varchar(50),
    total_canciones int,
    url varchar(255)
  )

  TABLE cancion (
    ID_Cancion varchar(50) NOT NULL,
    ID_Album varchar(50),
    titulo varchar(200),
    duracion int,
    url varchar(255),
    popularidad int
  )

  TABLE cancion_artista (
    ID_Cancion varchar(50),
    ID_Artista varchar(50)
  )

  TABLE album_artista (
    ID_Album varchar(50),
    ID_Artista varchar(50)
  )

  TABLE playlist (
    ID_Playlist int NOT NULL,
    ID_Usuario int,
    titulo varchar(200),
    fecha_creacion date
  )

  TABLE playlist_cancion (
    ID_Playlist int,
    ID_Cancion varchar(50),
    fecha_agregada timestamp,
    orden int
  )

  TABLE reproduccion (
    ID_Repro int NOT NULL,
    ID_Usuario int,
    ID_Cancion varchar(50),
    dispositivo enum('mobile','desktop','speaker'),
    fecha timestamp,
    duracion int
  )

  TABLE usuario (
    ID_Usuario int NOT NULL,
    nombre varchar(150),
    email varchar(150),
    plan enum('free','premium'),
    fecha_alta date
  )
`

export default demoDDL