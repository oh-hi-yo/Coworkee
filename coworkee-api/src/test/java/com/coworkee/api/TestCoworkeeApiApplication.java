package com.coworkee.api;

import org.springframework.boot.SpringApplication;

public class TestCoworkeeApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(CoworkeeApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
