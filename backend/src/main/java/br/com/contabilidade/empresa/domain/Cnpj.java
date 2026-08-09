package br.com.contabilidade.empresa.domain;

import br.com.contabilidade.common.error.ExcecaoNegocio;
import org.springframework.http.HttpStatus;

public final class Cnpj {

    private Cnpj() {
    }

    public static String normalizarEValidar(String valor) {
        String normalizado = valor == null ? "" : valor.replaceAll("\\D", "");
        if (!valido(normalizado)) {
            throw new ExcecaoNegocio("CNPJ_INVALIDO", "erros.cnpjInvalido", HttpStatus.BAD_REQUEST);
        }
        return normalizado;
    }

    public static boolean valido(String cnpj) {
        if (cnpj == null || !cnpj.matches("\\d{14}") || todosIguais(cnpj)) {
            return false;
        }
        return calcularDigito(cnpj.substring(0, 12), new int[]{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2})
                == Character.getNumericValue(cnpj.charAt(12))
                && calcularDigito(cnpj.substring(0, 13), new int[]{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2})
                == Character.getNumericValue(cnpj.charAt(13));
    }

    private static int calcularDigito(String base, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < base.length(); i++) {
            soma += Character.getNumericValue(base.charAt(i)) * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static boolean todosIguais(String cnpj) {
        return cnpj.chars().distinct().count() == 1;
    }
}
