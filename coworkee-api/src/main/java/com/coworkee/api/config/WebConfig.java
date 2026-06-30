package com.coworkee.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves the seeded portrait images (ADR-007). Files live under
 * {@code src/main/resources/static/api/portraits/**} and are exposed at
 * {@code /api/portraits/**}; the absolute URL is emitted by {@link
 * com.coworkee.api.person.PersonMapper}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/portraits/**")
                .addResourceLocations("classpath:/static/api/portraits/");
    }
}
