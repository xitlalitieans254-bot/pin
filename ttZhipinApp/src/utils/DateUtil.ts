
class DateUtil {
    private static parseDate(inputDate?: string | null): Date | undefined {
        if (!inputDate || typeof inputDate !== 'string') {
            return undefined;
        }

        const normalizedDate = inputDate.trim();
        if (!normalizedDate) {
            return undefined;
        }

        const dateTimeMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
        if (dateTimeMatch) {
            const [, year, month, day, hour = '00', minute = '00', second = '00'] = dateTimeMatch;
            const parsedDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                Number(second)
            );

            return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
        }

        const parsedDate = new Date(normalizedDate);
        return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    static calculateAge(dateOfBirth?: string | null): number | undefined {
        const birthDate = DateUtil.parseDate(dateOfBirth);
        if (!birthDate) {
          return undefined;
        }

        // Get the current date
        const currentDate: Date = new Date();

        let age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        const dayDiff = currentDate.getDate() - birthDate.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          age -= 1;
        }

        return age >= 0 ? age : undefined;
      }

      static formatWorkDate(inputDate?: string | null): string {
        const dateObject = DateUtil.parseDate(inputDate);
        if (!dateObject) {
          return '';
        }

        const year = dateObject.getFullYear();
        const month = (dateObject.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，需要加1
        return `${year}.${month}`;
      }
}


export default DateUtil;
