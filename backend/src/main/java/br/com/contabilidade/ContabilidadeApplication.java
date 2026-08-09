package br.com.contabilidade;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class ContabilidadeApplication {

    public static void main(String[] args) {
        SpringApplication.run(ContabilidadeApplication.class, args);
    }
}
