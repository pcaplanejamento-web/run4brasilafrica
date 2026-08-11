import { describe, it, expect } from "vitest";
import { parseResultsCsv } from "@/lib/results/parse";

const HEADER =
  "Colocação Geral;Número;Nome;Sexo;Idade;Codigo Faixa Etária;Colocação Faixa Etária;Equipe;Descrição Modalidade;Descrição Categoria;Tempo Bruto;Tempo Liquido";

describe("parseResultsCsv", () => {
  it("lê o formato oficial (;), casando as colunas pelo cabeçalho", () => {
    const csv = [
      HEADER,
      "1;5702;WELLINGTON CÉSAR ARAÚJO DO NASCIMENTO;M;25;M2529;-;WC ASSESSORIA;5KM;;00:15:53;00:15:53",
      "2;5655;VALDIR DE SOUSA ROCHA JÚNIOR;M;19;M1419;-;ESCOLINHA JP;5KM;;00:17:24;00:17:24",
      "", // linha em branco final → ignorada
    ].join("\n");
    const rows = parseResultsCsv(csv);
    expect(rows).toHaveLength(2);
    const a = rows[0];
    expect(a.pos).toBe(1);
    expect(a.bib).toBe("5702");
    expect(a.name).toBe("WELLINGTON CÉSAR ARAÚJO DO NASCIMENTO"); // acentos preservados
    expect(a.age).toBe(25);
    expect(a.ageGroup).toBe("M2529");
    expect(a.ageGroupPos).toBeUndefined(); // "-" → ausente
    expect(a.team).toBe("WC ASSESSORIA");
    expect(a.modality).toBe("5KM");
    expect(a.category).toBeUndefined(); // vazio → ausente
    expect(a.timeNet).toBe("00:15:53");
  });

  it("trata equipe vazia e colocação de faixa numérica", () => {
    const csv = [
      HEADER,
      "6;5283;JEFFERSON FAUSTINO DOS SANTOS;M;37;M3539;1;;5KM;;00:18:45;00:18:44",
    ].join("\n");
    const [r] = parseResultsCsv(csv);
    expect(r.team).toBeUndefined(); // Equipe vazia
    expect(r.ageGroupPos).toBe("1");
    expect(r.timeGross).toBe("00:18:45");
    expect(r.timeNet).toBe("00:18:44");
  });

  it("ordena pela colocação mesmo fora de ordem e descarta linhas inválidas", () => {
    const csv = [
      HEADER,
      "3;5632;BRUNNO ALVES ROCHA;M;18;M1419;-;ESCOLINHA JP;5KM;;00:17:44;00:17:43",
      "1;5702;WELLINGTON;M;25;M2529;-;;5KM;;00:15:53;00:15:53",
      "x;0000;LINHA SEM POSIÇÃO;M;;;;;5KM;;;", // pos inválida → descartada
      ";;;;;;;;;;;", // vazia de tudo → descartada
    ].join("\n");
    const rows = parseResultsCsv(csv);
    expect(rows.map((r) => r.pos)).toEqual([1, 3]);
  });

  it("aceita separador vírgula e cabeçalho sem acento", () => {
    const csv = [
      "Colocacao Geral,Numero,Nome,Sexo,Idade,Codigo Faixa Etaria,Colocacao Faixa Etaria,Equipe,Descricao Modalidade,Descricao Categoria,Tempo Bruto,Tempo Liquido",
      "1,5702,MARIA DA SILVA,F,30,F3034,1,TEAM,5KM,,00:20:00,00:19:50",
    ].join("\n");
    const [r] = parseResultsCsv(csv);
    expect(r.pos).toBe(1);
    expect(r.name).toBe("MARIA DA SILVA");
    expect(r.sex).toBe("F");
    expect(r.timeNet).toBe("00:19:50");
  });

  it("cai para a ordem canônica quando não há cabeçalho reconhecível", () => {
    const csv = "1;5702;JOÃO;M;25;M2529;-;EQUIPE X;5KM;;00:15:53;00:15:53";
    const [r] = parseResultsCsv(csv);
    expect(r.pos).toBe(1);
    expect(r.name).toBe("JOÃO");
    expect(r.team).toBe("EQUIPE X");
  });

  it("retorna vazio para entrada vazia", () => {
    expect(parseResultsCsv("")).toEqual([]);
    expect(parseResultsCsv("\n\n")).toEqual([]);
  });
});
