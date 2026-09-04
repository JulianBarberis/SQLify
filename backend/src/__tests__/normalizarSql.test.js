import { normalizeGeneratedSql, fallbackSql } from '../utils/normalizarSql.js'

describe('normalizarSql with AST Parser', () => {
  it('retorna null para valores no válidos o vacíos', () => {
    expect(normalizeGeneratedSql(null)).toBeNull()
    expect(normalizeGeneratedSql(undefined)).toBeNull()
    expect(normalizeGeneratedSql('')).toBeNull()
    expect(normalizeGeneratedSql(12345)).toBeNull()
    expect(normalizeGeneratedSql('DROP DATABASE test')).toBeNull()
    expect(normalizeGeneratedSql('   -- comentario sin select   ')).toBeNull()
  })

  it('permite consultas SELECT válidas que consultan tablas del dominio', () => {
    const raw = '```sql SELECT id_cancion, titulo, duracion FROM Cancion WHERE duracion > 200 LIMIT 10; ```'
    const clean = normalizeGeneratedSql(raw)
    expect(clean).toBe('SELECT id_cancion, titulo, duracion FROM cancion WHERE duracion > 200 LIMIT 10')
  })

  it('permite consultas con palabras como "drop" dentro de cadenas de texto literales', () => {
    const raw = "SELECT * FROM Cancion WHERE titulo LIKE '%drop%' LIMIT 5;"
    const clean = normalizeGeneratedSql(raw)
    expect(clean).toBe("SELECT * FROM cancion WHERE titulo LIKE '%drop%' LIMIT 5")
  })

  it('limpia comentarios de línea y de bloque adecuadamente', () => {
    const raw = `
      -- Este es un comentario
      /* Comentario de bloque */
      SELECT * FROM Artista;
    `
    const clean = normalizeGeneratedSql(raw)
    expect(clean).toBe('SELECT * FROM artista')
  })

  it('auto-corrige cláusulas LIMIT colgantes sin número', () => {
    const raw = 'SELECT * FROM Cancion LIMIT'
    const clean = normalizeGeneratedSql(raw)
    expect(clean).toBe('SELECT * FROM cancion LIMIT 100')
  })

  it('bloquea sentencias DDL (DROP TABLE, ALTER TABLE)', () => {
    expect(normalizeGeneratedSql('DROP TABLE Cancion;')).toBeNull()
    expect(normalizeGeneratedSql('ALTER TABLE Usuario ADD COLUMN test INT;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT * FROM Cancion; DROP TABLE Usuario;')).toBe('SELECT * FROM cancion')
  })

  it('bloquea sentencias DML que no son SELECT (INSERT, UPDATE, DELETE)', () => {
    expect(normalizeGeneratedSql("INSERT INTO Usuario (nombre) VALUES ('hacker');")).toBeNull()
    expect(normalizeGeneratedSql("UPDATE Usuario SET nombre = 'hacker';")).toBeNull()
    expect(normalizeGeneratedSql('DELETE FROM Usuario WHERE id = 1;')).toBeNull()
  })

  it('bloquea funciones y patrones de inyección peligrosos (SLEEP, BENCHMARK, LOAD_FILE, INTO OUTFILE)', () => {
    expect(normalizeGeneratedSql('SELECT SLEEP(5);')).toBeNull()
    expect(normalizeGeneratedSql('SELECT BENCHMARK(1000000, MD5(1));')).toBeNull()
    expect(normalizeGeneratedSql("SELECT LOAD_FILE('/etc/passwd');")).toBeNull()
    expect(normalizeGeneratedSql('SELECT sys_eval("whoami");')).toBeNull()
    expect(normalizeGeneratedSql('SELECT sys_exec("whoami");')).toBeNull()
    expect(normalizeGeneratedSql("SELECT * FROM Cancion INTO OUTFILE '/tmp/dump.txt';")).toBeNull()
    expect(normalizeGeneratedSql("SELECT * FROM Cancion INTO DUMPFILE '/tmp/dump.bin';")).toBeNull()
  })

  it('bloquea consultas a tablas del sistema o fuera de la lista permitida', () => {
    expect(normalizeGeneratedSql('SELECT * FROM information_schema.tables;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT user, host FROM mysql.user;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT * FROM secret_table;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT 1;')).toBeNull() // sin tablas
  })

  it('retorna null ante errores de sintaxis irrecuperables en el parser', () => {
    expect(normalizeGeneratedSql('SELECT FROM WHERE ;;;')).toBeNull()
  })

  it('genera SQL seguro de fallback con y sin argumento', () => {
    expect(fallbackSql('Consulta inválida')).toBe('SELECT "Consulta inválida" AS mensaje')
    expect(fallbackSql()).toBe('SELECT "Consulta no relacionada con la base de datos" AS mensaje')
  })
})

import pkg from 'node-sql-parser'

describe('normalizarSql fallback and edge cases', () => {
  it('activa el fallback a mysql cuando mariadb tableList o astify falla', () => {
    const origTableList = pkg.Parser.prototype.tableList
    const origAstify = pkg.Parser.prototype.astify

    pkg.Parser.prototype.tableList = function (sql, opt) {
      if (opt?.database === 'mariadb') {
        throw new Error('MariaDB tableList simulado fallido')
      }
      return origTableList.call(this, sql, opt)
    }

    const clean1 = normalizeGeneratedSql('SELECT * FROM Artista')
    expect(clean1).toBe('SELECT * FROM artista')

    pkg.Parser.prototype.astify = function (sql, opt) {
      if (opt?.database === 'mariadb') {
        throw new Error('MariaDB astify simulado fallido')
      }
      return origAstify.call(this, sql, opt)
    }

    const clean2 = normalizeGeneratedSql('SELECT * FROM Cancion')
    expect(clean2).toBe('SELECT * FROM cancion')

    pkg.Parser.prototype.tableList = origTableList
    pkg.Parser.prototype.astify = origAstify
  })

  it('retorna null si tableList contiene entradas vacías o malformadas', () => {
    const origTableList = pkg.Parser.prototype.tableList
    pkg.Parser.prototype.tableList = function () {
      return ['::']
    }
    expect(normalizeGeneratedSql('SELECT * FROM Artista')).toBeNull()
    pkg.Parser.prototype.tableList = origTableList
  })

  it('retorna null si astify retorna múltiples sentencias o una sentencia que no es SELECT', () => {
    const origAstify = pkg.Parser.prototype.astify
    pkg.Parser.prototype.astify = function () {
      return [{ type: 'update' }]
    }
    expect(normalizeGeneratedSql('SELECT * FROM Artista')).toBeNull()

    pkg.Parser.prototype.astify = function () {
      return [{ type: 'select' }, { type: 'select' }]
    }
    expect(normalizeGeneratedSql('SELECT * FROM Artista')).toBeNull()

    pkg.Parser.prototype.astify = origAstify
  })
})
