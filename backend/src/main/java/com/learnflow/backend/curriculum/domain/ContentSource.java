package com.learnflow.backend.curriculum.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "content_source")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContentSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true)
    private String contentKey;

    @Column(nullable = false)
    private String name;

    private String url;

    @Column(nullable = false)
    private String license;

    @Column(name = "license_url")
    private String licenseUrl;

    private String attribution;

    public ContentSource(String contentKey) {
        this.contentKey = contentKey;
    }

    public void update(
            String name, String url, String license, String licenseUrl, String attribution) {
        this.name = name;
        this.url = url;
        this.license = license;
        this.licenseUrl = licenseUrl;
        this.attribution = attribution;
    }
}
