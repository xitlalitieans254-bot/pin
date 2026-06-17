package com.whoiszxl.zhipin.member.cqrs.command;

import org.junit.jupiter.api.Test;

import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.Validator;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AttachmentResumeCommandValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void saveCommandRejectsBlankFilenameAndUrl() {
        AttachmentResumeSaveCommand command = new AttachmentResumeSaveCommand();
        command.setFilename(" ");
        command.setUrl("");

        Set<ConstraintViolation<AttachmentResumeSaveCommand>> violations = validator.validate(command);

        assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("filename", "url");
    }

    @Test
    void updateCommandRejectsBlankIdAndFilename() {
        ResumeNameUpdateCommand command = new ResumeNameUpdateCommand();
        command.setId("");
        command.setNewFilename(" ");

        Set<ConstraintViolation<ResumeNameUpdateCommand>> violations = validator.validate(command);

        assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("id", "newFilename");
    }
}
