import { normalizeGeneratedSql, fallbackSql } from '../utils/normalizarSql.js'

describe('normalizarSql with AST Parser', () => {
  it('permits valid SELECT queries targeting domain tables', () => {
    const raw = '```sql SELECT id_cancion, titulo, duracion FROM Cancion WHERE duracion > 200 LIMIT 10; ```'
    const clean = normalizeGeneratedSql(raw)
    expect(clean).toBe('SELECT id_cancion, titulo, duracion FROM Cancion WHERE duracion > 200 LIMIT 10')
  })

  it('permits queries with words like "drop" in string literals (e.g. track title)', () => {
    const raw = "SELECT * FROM Cancion WHERE titulo LIKE '%drop%' LIMIT 5;"
    const clean = normalizeGeneratedSql(raw)
    expect(clean).toBe("SELECT * FROM Cancion WHERE titulo LIKE '%drop%' LIMIT 5")
  })

  it('blocks DDL statements (DROP TABLE, ALTER TABLE)', () => {
    expect(normalizeGeneratedSql('DROP TABLE Cancion;')).toBeNull()
    expect(normalizeGeneratedSql('ALTER TABLE Usuario ADD COLUMN test INT;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT * FROM Cancion; DROP TABLE Usuario;')).toBe('SELECT * FROM Cancion')
  })

  it('blocks non-SELECT DML statements (INSERT, UPDATE, DELETE)', () => {
    expect(normalizeGeneratedSql("INSERT INTO Usuario (nombre) VALUES ('hacker');")).toBeNull()
    expect(normalizeGeneratedSql("UPDATE Usuario SET nombre = 'hacker';")).toBeNull()
    expect(normalizeGeneratedSql("DELETE FROM Usuario WHERE id = 1;")).toBeNull()
  })

  it('blocks dangerous functions (SLEEP, BENCHMARK, LOAD_FILE)', () => {
    expect(normalizeGeneratedSql('SELECT SLEEP(5);')).toBeNull()
    expect(normalizeGeneratedSql('SELECT BENCHMARK(1000000, MD5(1));')).toBeNull()
    expect(normalizeGeneratedSql('SELECT LOAD_FILE(\'/etc/passwd\');')).toBeNull()
  })

  it('blocks queries targeting non-whitelisted tables or system tables', () => {
    expect(normalizeGeneratedSql('SELECT * FROM information_schema.tables;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT user, host FROM mysql.user;')).toBeNull()
    expect(normalizeGeneratedSql('SELECT * FROM secret_table;')).toBeNull()
  })

  it('generates safe fallback SQL', () => {
    const fb = fallbackSql('Consulta inválida')
    expect(fb).toBe('SELECT "Consulta inválida" AS mensaje')
  })
})
