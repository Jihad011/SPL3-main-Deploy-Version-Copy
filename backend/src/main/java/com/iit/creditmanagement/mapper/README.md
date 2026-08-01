# Mapper Directory

This package was planned for **MapStruct** entity↔DTO mappers.

## Decision: Static Factory Methods Instead

We chose to implement mapping via **static `from()` factory methods on the DTO records**
(e.g. `CourseResponse.from(course)`) instead of MapStruct for the following reasons:

1. **Simpler** — No annotation processor configuration needed
2. **Type-safe** — Compiler catches missing fields at build time
3. **Self-contained** — The DTO knows how to construct itself from the entity
4. **Testable** — Factory methods are testable without Spring context

## Example Pattern Used

```java
// In CourseResponse.java
public static CourseResponse from(Course c) {
    return new CourseResponse(
        c.getId(), c.getCode(), c.getName(), ...
    );
}

// Usage in service
return CourseResponse.from(courseRepository.save(course));
```

## If MapStruct Is Needed Later

Add to `pom.xml` (already included as dependency):
```xml
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
```

Then create mappers here following the pattern:
```java
@Mapper(componentModel = "spring")
public interface CourseMapper {
    CourseResponse toResponse(Course course);
    Course toEntity(CourseRequest request);
}
```
