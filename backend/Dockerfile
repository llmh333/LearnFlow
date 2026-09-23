# Multi-stage build (Phase 8, D15): Maven build -> slim JRE runtime.
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Tuned for a 1 vCPU / 1GB RAM VPS (Phase 8): cap the heap as a percentage of the container's
# memory limit instead of a fixed -Xmx, use the low-overhead serial GC (fine for this app's low
# throughput), and shrink the default thread stack size.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=50 -XX:+UseSerialGC -Xss256k"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
